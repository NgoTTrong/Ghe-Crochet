# RAID VUA GHẸ — Plan 2: Gameplay + Player UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the player-facing game: gacha rolling, creature collection, the shared boss raid with live HP, leaderboards, the reward shop, gift-code redemption, and all mobile UI screens.

**Architecture:** Server API routes under `app/api/game/*` own all economic logic, reusing the pure functions from Plan 1 (`computeDamage`, `damageToShells`, `computeDailyReset`, gacha rolls) and the `createAdminClient()` Supabase client. Every economic write happens server-side after verifying the guest JWT (`getGuestUserId`). The shared boss HP bar updates live via Supabase Realtime on `game_boss`. UI is mobile-first React Client Components using the existing shadcn/Radix component library.

**Tech Stack:** Next.js 14 App Router, React 19, TypeScript, Tailwind, shadcn/ui, Supabase (`@supabase/supabase-js` browser client + Realtime).

**Depends on:** Plan 1 (Foundation) fully merged.

**Spec:** `docs/superpowers/specs/2026-06-13-raid-vua-ghe-game-design.md`

---

### Task 1: Extra DB objects — gift-code dedup, today leaderboard, realtime

**Files:**
- Create: `scripts/023_game_gameplay_objects.sql`

- [ ] **Step 1: Write the migration**

Create `scripts/023_game_gameplay_objects.sql`:

```sql
-- Per-user gift-code dedup: a player may redeem a given code at most once.
create table if not exists game_giftcode_uses (
  code_id  uuid not null references game_gift_codes(id) on delete cascade,
  user_id  uuid not null references game_users(id) on delete cascade,
  used_at  timestamptz not null default now(),
  primary key (code_id, user_id)
);
-- Same RLS lockdown as the Plan 1 tables (writes via service-role only).
alter table game_giftcode_uses enable row level security;

-- Today's top damage, summed from the attack log since a given UTC+7 day start.
-- p_since is an ISO timestamp computed by the API (start of the VN day).
create or replace function game_leaderboard_today(p_since timestamptz, p_limit int)
returns table(nickname text, damage bigint)
language sql
stable
as $$
  select u.nickname, sum(a.damage)::bigint as damage
  from game_attacks a
  join game_users u on u.id = a.user_id
  where a.created_at >= p_since
  group by u.nickname
  order by damage desc
  limit p_limit;
$$;

-- Enable Realtime so clients can subscribe to boss HP changes.
alter publication supabase_realtime add table game_boss;
```

- [ ] **Step 2: Run it in Supabase**

SQL Editor → paste `scripts/023_game_gameplay_objects.sql` → Run.
Expected: "Success." Verify under Database → Replication that `game_boss` is in the `supabase_realtime` publication.

- [ ] **Step 3: Commit**

```bash
git add scripts/023_game_gameplay_objects.sql
git commit -m "feat: add giftcode dedup, today-leaderboard fn, boss realtime"
```

---

### Task 2: Server clock helper (VN day)

**Files:**
- Create: `lib/game/server-clock.ts`

The booth runs in Vietnam (UTC+7). Daily resets and the today-leaderboard use the VN calendar day, not UTC.

- [ ] **Step 1: Write the helper**

Create `lib/game/server-clock.ts`:

```ts
const VN_OFFSET_MS = 7 * 60 * 60 * 1000

/** Current date in Vietnam time as an ISO date string (YYYY-MM-DD). */
export function todayVN(now: Date = new Date()): string {
  return new Date(now.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10)
}

/** Start of the current VN day, as a UTC Date (for querying the attack log). */
export function vnDayStartUTC(now: Date = new Date()): Date {
  const dayStr = todayVN(now) // YYYY-MM-DD in VN
  // VN midnight = 17:00 UTC the previous day.
  return new Date(`${dayStr}T00:00:00+07:00`)
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add lib/game/server-clock.ts
git commit -m "feat: add VN-timezone server clock helper"
```

---

### Task 3: Gacha roll API

**Files:**
- Create: `app/api/game/gacha/roll/route.ts`

- [ ] **Step 1: Write the route**

Create `app/api/game/gacha/roll/route.ts`:

```ts
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getGuestUserId } from "@/lib/game/guest-auth"
import { rollRarity, pickCreatureOfRarity } from "@/lib/game/gacha"
import type { Rarity } from "@/lib/game/economy"

export async function POST() {
  const userId = await getGuestUserId()
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 })

  const supabase = createAdminClient()

  // Atomically spend one ticket: only succeeds if the player has at least one.
  const { data: spent } = await supabase
    .from("game_users")
    .update({ summon_tickets: -1 }) // placeholder; replaced by rpc-style guard below
    .eq("id", userId)
    .lt("summon_tickets", 0) // never matches — see guarded decrement below
    .select("id")
    .maybeSingle()
  void spent // (kept intentionally unused; real decrement is the guarded update next)

  // Guarded decrement via raw filter: decrement only when tickets > 0.
  const { data: user } = await supabase
    .from("game_users")
    .select("summon_tickets")
    .eq("id", userId)
    .maybeSingle()
  if (!user || user.summon_tickets < 1) {
    return NextResponse.json({ error: "Hết Vé Triệu Hồi" }, { status: 400 })
  }
  const { data: dec } = await supabase
    .from("game_users")
    .update({ summon_tickets: user.summon_tickets - 1 })
    .eq("id", userId)
    .eq("summon_tickets", user.summon_tickets) // optimistic lock
    .select("summon_tickets")
    .maybeSingle()
  if (!dec) {
    return NextResponse.json({ error: "Vui lòng thử lại" }, { status: 409 })
  }

  // Roll a rarity, then pick a creature; fall back down to any creature.
  const { data: creatures } = await supabase
    .from("game_creatures")
    .select("id, name, rarity, image_url, skill_desc")
  const pool = (creatures ?? []) as {
    id: string; name: string; rarity: Rarity; image_url: string | null; skill_desc: string | null
  }[]
  if (pool.length === 0) {
    return NextResponse.json({ error: "Chưa có Linh Thú" }, { status: 500 })
  }
  const rarity = rollRarity(Math.random)
  const order: Rarity[] = ["UR", "SSR", "SR", "R"]
  let creatureId: string | null = pickCreatureOfRarity(pool, rarity, Math.random)
  for (const r of order) {
    if (creatureId) break
    creatureId = pickCreatureOfRarity(pool, r, Math.random)
  }
  const creature = pool.find((c) => c.id === creatureId)!

  // Was this creature already owned?
  const { data: owned } = await supabase
    .from("game_user_creatures")
    .select("creature_id")
    .eq("user_id", userId)
    .eq("creature_id", creature.id)
    .maybeSingle()
  const isNew = !owned
  if (isNew) {
    await supabase
      .from("game_user_creatures")
      .insert({ user_id: userId, creature_id: creature.id })
  }

  return NextResponse.json({
    creature: {
      id: creature.id,
      name: creature.name,
      rarity: creature.rarity,
      imageUrl: creature.image_url,
      skillDesc: creature.skill_desc,
    },
    isNew,
    remainingTickets: dec.summon_tickets,
  })
}
```

- [ ] **Step 2: Simplify the decrement (remove the dead placeholder block)**

The first `update(... -1)` block above is a no-op placeholder kept only to make the guarded-decrement intent obvious during review. Delete lines from `// Atomically spend one ticket` through `void spent ...` so the route starts the spend logic at `// Guarded decrement`. Re-read the file to confirm only the guarded decrement remains.

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: build succeeds; `/api/game/gacha/roll` listed.

- [ ] **Step 4: Manually verify a roll**

With dev server running and a valid `game_token` cookie (from a login curl, save the cookie jar):

```bash
curl -i -X POST http://localhost:3000/api/game/gacha/roll -b cookies.txt
```

Expected: HTTP 200 with a `creature` object, `isNew` boolean, and `remainingTickets` one lower than before. After tickets hit 0, returns HTTP 400 `"Hết Vé Triệu Hồi"`.

- [ ] **Step 5: Commit**

```bash
git add app/api/game/gacha/roll/route.ts
git commit -m "feat: add gacha roll API with guarded ticket spend"
```

---

### Task 4: Collection + creatures API

**Files:**
- Create: `app/api/game/collection/route.ts`

- [ ] **Step 1: Write the route**

Create `app/api/game/collection/route.ts`:

```ts
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getGuestUserId } from "@/lib/game/guest-auth"

// Returns every creature plus whether the current player owns it (for the
// collection grid: owned creatures show fully, others as silhouettes).
export async function GET() {
  const userId = await getGuestUserId()
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 })

  const supabase = createAdminClient()
  const [{ data: creatures }, { data: owned }] = await Promise.all([
    supabase
      .from("game_creatures")
      .select("id, name, rarity, image_url, skill_desc")
      .order("rarity"),
    supabase.from("game_user_creatures").select("creature_id").eq("user_id", userId),
  ])

  const ownedIds = new Set((owned ?? []).map((o) => o.creature_id))
  const items = (creatures ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    rarity: c.rarity,
    imageUrl: c.image_url,
    skillDesc: c.skill_desc,
    owned: ownedIds.has(c.id),
  }))
  return NextResponse.json({ items })
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm build`, then `curl -s http://localhost:3000/api/game/collection -b cookies.txt`
Expected: JSON `items` array; each item has `owned` true/false. The welcome creature from signup shows `owned:true`.

- [ ] **Step 3: Commit**

```bash
git add app/api/game/collection/route.ts
git commit -m "feat: add collection API with ownership flags"
```

---

### Task 5: Raid boss state API

**Files:**
- Create: `app/api/game/raid/state/route.ts`

- [ ] **Step 1: Write the route**

Create `app/api/game/raid/state/route.ts`:

```ts
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getGuestUserId } from "@/lib/game/guest-auth"
import { ECONOMY } from "@/lib/game/economy"
import { computeDailyReset } from "@/lib/game/daily"
import { todayVN } from "@/lib/game/server-clock"

// Boss state + the player's owned creatures + attacks left today.
export async function GET() {
  const userId = await getGuestUserId()
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 })

  const supabase = createAdminClient()

  const { data: boss } = await supabase
    .from("game_boss")
    .select("id, name, max_hp, current_hp")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: user } = await supabase
    .from("game_users")
    .select("attacks_today, last_reset")
    .eq("id", userId)
    .maybeSingle()

  // Reflect a pending daily reset in the returned count (the attack route
  // performs the actual write).
  const resetPatch = user ? computeDailyReset(user.last_reset, todayVN()) : null
  const attacksToday = resetPatch ? 0 : user?.attacks_today ?? 0
  const attacksLeft = Math.max(0, ECONOMY.antiFarm.dailyFreeAttacks - attacksToday)

  const { data: creatures } = await supabase
    .from("game_user_creatures")
    .select("creature_id, game_creatures(id, name, rarity, image_url, skill_desc)")
    .eq("user_id", userId)

  const owned = (creatures ?? []).map((row: any) => ({
    id: row.game_creatures.id,
    name: row.game_creatures.name,
    rarity: row.game_creatures.rarity,
    imageUrl: row.game_creatures.image_url,
    skillDesc: row.game_creatures.skill_desc,
  }))

  return NextResponse.json({
    boss: boss
      ? { id: boss.id, name: boss.name, maxHp: boss.max_hp, currentHp: boss.current_hp }
      : null,
    creatures: owned,
    attacksLeft,
    dailyFreeAttacks: ECONOMY.antiFarm.dailyFreeAttacks,
  })
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm build`, then `curl -s http://localhost:3000/api/game/raid/state -b cookies.txt`
Expected: JSON with `boss` (currentHp = 100000000 on a fresh DB), `creatures` array, `attacksLeft` = 10.

- [ ] **Step 3: Commit**

```bash
git add app/api/game/raid/state/route.ts
git commit -m "feat: add raid boss state API"
```

---

### Task 6: Raid attack API (core gameplay loop)

**Files:**
- Create: `app/api/game/raid/attack/route.ts`

This is the most important endpoint: it enforces the daily quota, runs server-side combat, applies atomic boss damage, and awards capped shells.

- [ ] **Step 1: Write the route**

Create `app/api/game/raid/attack/route.ts`:

```ts
import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getGuestUserId } from "@/lib/game/guest-auth"
import { ECONOMY } from "@/lib/game/economy"
import { rollStats, computeDamage, type CreatureBonus } from "@/lib/game/combat"
import { damageToShells } from "@/lib/game/rewards"
import { computeDailyReset } from "@/lib/game/daily"
import { todayVN } from "@/lib/game/server-clock"

export async function POST(request: NextRequest) {
  const userId = await getGuestUserId()
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 })

  const { creatureId } = await request.json()
  if (!creatureId) return NextResponse.json({ error: "Chưa chọn Linh Thú" }, { status: 400 })

  const supabase = createAdminClient()

  // Load player and apply a pending daily reset before checking the quota.
  const { data: user } = await supabase
    .from("game_users")
    .select("shells, total_damage, shells_today, attacks_today, last_reset")
    .eq("id", userId)
    .maybeSingle()
  if (!user) return NextResponse.json({ error: "Không tìm thấy tài khoản" }, { status: 404 })

  const resetPatch = computeDailyReset(user.last_reset, todayVN())
  const attacksToday = resetPatch ? 0 : user.attacks_today
  const shellsToday = resetPatch ? 0 : user.shells_today
  if (attacksToday >= ECONOMY.antiFarm.dailyFreeAttacks) {
    return NextResponse.json(
      { error: "Hết lượt đánh hôm nay. Mua hàng để nhận thêm lượt!" },
      { status: 429 }
    )
  }

  // Verify ownership and load the creature's bonuses.
  const { data: ownedRow } = await supabase
    .from("game_user_creatures")
    .select("game_creatures(attack_bonus, crit_bonus, hp_bonus, skill_key, name)")
    .eq("user_id", userId)
    .eq("creature_id", creatureId)
    .maybeSingle()
  if (!ownedRow) return NextResponse.json({ error: "Bạn không sở hữu Linh Thú này" }, { status: 403 })
  const cr: any = ownedRow.game_creatures
  const bonus: CreatureBonus = {
    attackBonus: Number(cr.attack_bonus),
    critBonus: Number(cr.crit_bonus),
    hpBonus: Number(cr.hp_bonus),
    skillKey: cr.skill_key || "",
  }

  // Load the active boss.
  const { data: boss } = await supabase
    .from("game_boss")
    .select("id, max_hp, current_hp")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!boss || boss.current_hp <= 0) {
    return NextResponse.json({ error: "Vua Ghẹ đã bị hạ gục!" }, { status: 409 })
  }

  // Server-side combat.
  const bossHpPct = boss.current_hp / boss.max_hp
  const stats = rollStats(Math.random)
  const result = computeDamage(stats, bonus, { bossHpPct }, Math.random)

  // Atomic boss damage via the RPC.
  const { data: newHp, error: rpcErr } = await supabase.rpc("game_deal_damage", {
    p_boss_id: boss.id,
    p_damage: result.total,
  })
  if (rpcErr) {
    return NextResponse.json({ error: "Lỗi gây sát thương" }, { status: 500 })
  }

  // Award shells (capped) and update the player.
  const shellsEarned = damageToShells(result.total, shellsToday)
  const patch: Record<string, unknown> = {
    shells: user.shells + shellsEarned,
    total_damage: Number(user.total_damage) + result.total,
    attacks_today: attacksToday + 1,
    shells_today: shellsToday + shellsEarned,
  }
  if (resetPatch) patch.last_reset = resetPatch.last_reset
  await supabase.from("game_users").update(patch).eq("id", userId)

  await supabase.from("game_attacks").insert({
    user_id: userId,
    boss_id: boss.id,
    creature_id: creatureId,
    damage: result.total,
    shells_earned: shellsEarned,
  })

  return NextResponse.json({
    stats: result.stats,
    isCrit: result.isCrit,
    skillTriggered: result.skillTriggered,
    skillName: result.skillName,
    creatureName: cr.name,
    damage: result.total,
    shellsEarned,
    log: result.log,
    bossCurrentHp: newHp,
    bossMaxHp: boss.max_hp,
    attacksLeft: Math.max(0, ECONOMY.antiFarm.dailyFreeAttacks - (attacksToday + 1)),
  })
}
```

- [ ] **Step 2: Verify build + manual attack**

Run: `pnpm build`. With a logged-in cookie jar and a known owned `creatureId` (from `/api/game/raid/state`):

```bash
curl -i -X POST http://localhost:3000/api/game/raid/attack \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{"creatureId":"<owned-id>"}'
```

Expected: HTTP 200 with `damage`, `log` lines, `shellsEarned`, `bossCurrentHp` lower than `bossMaxHp`, `attacksLeft` decremented. Re-running until `attacksLeft` hits 0 then once more returns HTTP 429 `"Hết lượt đánh hôm nay..."`. Attacking with a non-owned id returns HTTP 403.

- [ ] **Step 3: Commit**

```bash
git add app/api/game/raid/attack/route.ts
git commit -m "feat: add raid attack API with quota, server combat, atomic damage"
```

---

### Task 7: Leaderboard API

**Files:**
- Create: `app/api/game/leaderboard/route.ts`

- [ ] **Step 1: Write the route**

Create `app/api/game/leaderboard/route.ts`:

```ts
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { vnDayStartUTC } from "@/lib/game/server-clock"

export async function GET() {
  const supabase = createAdminClient()

  const [{ data: allTime }, { data: today }] = await Promise.all([
    supabase
      .from("game_users")
      .select("nickname, total_damage")
      .order("total_damage", { ascending: false })
      .limit(20),
    supabase.rpc("game_leaderboard_today", {
      p_since: vnDayStartUTC().toISOString(),
      p_limit: 20,
    }),
  ])

  return NextResponse.json({
    allTime: (allTime ?? []).map((r) => ({ nickname: r.nickname, damage: Number(r.total_damage) })),
    today: (today ?? []).map((r: any) => ({ nickname: r.nickname, damage: Number(r.damage) })),
  })
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm build`, then `curl -s http://localhost:3000/api/game/leaderboard`
Expected: JSON with `allTime` and `today` arrays sorted by damage descending. After the Task 6 attack, your nickname appears in both.

- [ ] **Step 3: Commit**

```bash
git add app/api/game/leaderboard/route.ts
git commit -m "feat: add leaderboard API (today + all-time)"
```

---

### Task 8: Shop list + redeem API

**Files:**
- Create: `app/api/game/shop/route.ts`
- Create: `app/api/game/shop/redeem/route.ts`

- [ ] **Step 1: Write the shop list route**

Create `app/api/game/shop/route.ts`:

```ts
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getGuestUserId } from "@/lib/game/guest-auth"

export async function GET() {
  const userId = await getGuestUserId()
  const supabase = createAdminClient()

  const { data: rewards } = await supabase
    .from("game_rewards")
    .select("id, name, shell_cost, requires_purchase, stock")
    .eq("is_active", true)
    .order("shell_cost")

  let shells = 0
  if (userId) {
    const { data: user } = await supabase
      .from("game_users")
      .select("shells")
      .eq("id", userId)
      .maybeSingle()
    shells = user?.shells ?? 0
  }

  return NextResponse.json({
    shells,
    rewards: (rewards ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      shellCost: r.shell_cost,
      requiresPurchase: r.requires_purchase,
      stock: r.stock, // null = unlimited
    })),
  })
}
```

- [ ] **Step 2: Write the redeem route**

Create `app/api/game/shop/redeem/route.ts`:

```ts
import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getGuestUserId } from "@/lib/game/guest-auth"

function makeRedeemCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return `REWARD-${code}`
}

export async function POST(request: NextRequest) {
  const userId = await getGuestUserId()
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 })

  const { rewardId } = await request.json()
  if (!rewardId) return NextResponse.json({ error: "Thiếu phần thưởng" }, { status: 400 })

  const supabase = createAdminClient()
  const { data: reward } = await supabase
    .from("game_rewards")
    .select("id, name, shell_cost, requires_purchase, stock, is_active")
    .eq("id", rewardId)
    .maybeSingle()
  if (!reward || !reward.is_active) {
    return NextResponse.json({ error: "Phần thưởng không khả dụng" }, { status: 404 })
  }
  if (reward.requires_purchase) {
    return NextResponse.json(
      { error: "Phần thưởng này cần mã mua hàng — vui lòng tới quầy." },
      { status: 403 }
    )
  }
  if (reward.stock !== null && reward.stock <= 0) {
    return NextResponse.json({ error: "Phần thưởng đã hết" }, { status: 409 })
  }

  // Guarded shell deduction: only succeeds when the player has enough.
  const { data: user } = await supabase
    .from("game_users")
    .select("shells")
    .eq("id", userId)
    .maybeSingle()
  if (!user || user.shells < reward.shell_cost) {
    return NextResponse.json({ error: "Không đủ Vỏ Ghẹ" }, { status: 400 })
  }
  const { data: deducted } = await supabase
    .from("game_users")
    .update({ shells: user.shells - reward.shell_cost })
    .eq("id", userId)
    .eq("shells", user.shells) // optimistic lock
    .gte("shells", reward.shell_cost)
    .select("shells")
    .maybeSingle()
  if (!deducted) return NextResponse.json({ error: "Vui lòng thử lại" }, { status: 409 })

  // Decrement stock if tracked (best-effort; booth-scale contention is low).
  if (reward.stock !== null) {
    await supabase
      .from("game_rewards")
      .update({ stock: reward.stock - 1 })
      .eq("id", reward.id)
      .gt("stock", 0)
  }

  const code = makeRedeemCode()
  await supabase.from("game_redeems").insert({
    user_id: userId,
    reward_id: reward.id,
    code,
    status: "PENDING",
  })

  return NextResponse.json({ code, rewardName: reward.name, remainingShells: deducted.shells })
}
```

- [ ] **Step 3: Verify build + manual check**

Run: `pnpm build`. Seed a test reward first in Supabase SQL editor:
`insert into game_rewards (name, shell_cost) values ('Sticker', 5);`
Then with a logged-in cookie jar that has ≥5 shells:

```bash
curl -s http://localhost:3000/api/game/shop -b cookies.txt
curl -i -X POST http://localhost:3000/api/game/shop/redeem \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{"rewardId":"<sticker-id>"}'
```

Expected: list shows the Sticker; redeem returns HTTP 200 with a `REWARD-XXXXX` code and reduced `remainingShells`. Redeeming without enough shells returns HTTP 400 `"Không đủ Vỏ Ghẹ"`.

- [ ] **Step 4: Commit**

```bash
git add app/api/game/shop/route.ts app/api/game/shop/redeem/route.ts
git commit -m "feat: add shop list and reward redeem APIs"
```

---

### Task 9: Gift-code redeem API

**Files:**
- Create: `app/api/game/giftcode/redeem/route.ts`

- [ ] **Step 1: Write the route**

Create `app/api/game/giftcode/redeem/route.ts`:

```ts
import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getGuestUserId } from "@/lib/game/guest-auth"

export async function POST(request: NextRequest) {
  const userId = await getGuestUserId()
  if (!userId) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 })

  const { code } = await request.json()
  if (!code) return NextResponse.json({ error: "Thiếu mã" }, { status: 400 })

  const supabase = createAdminClient()
  const { data: gift } = await supabase
    .from("game_gift_codes")
    .select("id, grants_tickets, grants_attacks, max_uses, used_count, is_active")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle()
  if (!gift || !gift.is_active) {
    return NextResponse.json({ error: "Mã không hợp lệ" }, { status: 404 })
  }
  if (gift.used_count >= gift.max_uses) {
    return NextResponse.json({ error: "Mã đã hết lượt sử dụng" }, { status: 409 })
  }

  // One use per player: the PK on (code_id, user_id) blocks a second redeem.
  const { error: dupErr } = await supabase
    .from("game_giftcode_uses")
    .insert({ code_id: gift.id, user_id: userId })
  if (dupErr) {
    return NextResponse.json({ error: "Bạn đã dùng mã này rồi" }, { status: 409 })
  }

  await supabase
    .from("game_gift_codes")
    .update({ used_count: gift.used_count + 1 })
    .eq("id", gift.id)

  // Grant rewards. grants_attacks gives back used attacks today (clamped at 0).
  const { data: user } = await supabase
    .from("game_users")
    .select("summon_tickets, attacks_today")
    .eq("id", userId)
    .maybeSingle()
  if (user) {
    await supabase
      .from("game_users")
      .update({
        summon_tickets: user.summon_tickets + gift.grants_tickets,
        attacks_today: Math.max(0, user.attacks_today - gift.grants_attacks),
      })
      .eq("id", userId)
  }

  return NextResponse.json({
    grantedTickets: gift.grants_tickets,
    grantedAttacks: gift.grants_attacks,
  })
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm build`. Seed a gift code in Supabase:
`insert into game_gift_codes (code, grants_tickets, max_uses) values ('PURCHASE-TEST1', 5, 100);`
Then:

```bash
curl -i -X POST http://localhost:3000/api/game/giftcode/redeem \
  -H "Content-Type: application/json" -b cookies.txt \
  -d '{"code":"PURCHASE-TEST1"}'
```

Expected: HTTP 200 `grantedTickets:5`. Redeeming the same code with the same cookie again returns HTTP 409 `"Bạn đã dùng mã này rồi"`.

- [ ] **Step 3: Commit**

```bash
git add app/api/game/giftcode/redeem/route.ts
git commit -m "feat: add gift-code redeem API with per-user dedup"
```

---

### Task 10: Client helper — device token + fetch wrappers

**Files:**
- Create: `lib/game/client.ts`

- [ ] **Step 1: Write the helper**

Create `lib/game/client.ts`:

```ts
"use client"

const DEVICE_KEY = "ghe_device_token"

/** Get (or lazily create + persist) this browser's device token. */
export function getDeviceToken(): string {
  if (typeof window === "undefined") return ""
  let token = localStorage.getItem(DEVICE_KEY)
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, token)
  }
  return token
}

/** POST JSON to a game API route; throws Error(message) on non-2xx. */
export async function gamePost<T = any>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Lỗi không xác định")
  return data
}

/** GET JSON from a game API route; throws Error(message) on non-2xx. */
export async function gameGet<T = any>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: "include" })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Lỗi không xác định")
  return data
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/game/client.ts
git commit -m "feat: add game client helpers (device token, fetch wrappers)"
```

---

### Task 11: Rarity badge component

**Files:**
- Create: `app/game/components/rarity-badge.tsx`

A shared, theme-bright badge used across collection/gacha/raid.

- [ ] **Step 1: Write the component**

Create `app/game/components/rarity-badge.tsx`:

```tsx
const STYLES: Record<string, string> = {
  R: "bg-slate-200 text-slate-700",
  SR: "bg-sky-200 text-sky-800",
  SSR: "bg-amber-200 text-amber-800",
  UR: "bg-fuchsia-200 text-fuchsia-800",
}

export function RarityBadge({ rarity }: { rarity: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${STYLES[rarity] ?? STYLES.R}`}>
      {rarity}
    </span>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/game/components/rarity-badge.tsx
git commit -m "feat: add rarity badge component"
```

---

### Task 12: Bottom navigation

**Files:**
- Create: `app/game/components/game-nav.tsx`

- [ ] **Step 1: Write the component**

Create `app/game/components/game-nav.tsx`:

```tsx
"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sparkles, BookOpen, Swords, Trophy, Gift } from "lucide-react"

const ITEMS = [
  { href: "/game/raid", label: "Raid", icon: Swords },
  { href: "/game/gacha", label: "Triệu Hồi", icon: Sparkles },
  { href: "/game/collection", label: "Bộ Sưu Tập", icon: BookOpen },
  { href: "/game/leaderboard", label: "BXH", icon: Trophy },
  { href: "/game/shop", label: "Đổi Thưởng", icon: Gift },
]

export function GameNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 flex justify-around border-t bg-white/95 py-2 backdrop-blur">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = path === href
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 text-[11px] ${
              active ? "text-fuchsia-600 font-semibold" : "text-slate-500"
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/game/components/game-nav.tsx
git commit -m "feat: add game bottom navigation"
```

---

### Task 13: Game layout + middleware check

**Files:**
- Create: `app/game/layout.tsx`
- Modify: `lib/supabase/middleware.ts` (only if it gates `/game` — verify first)

- [ ] **Step 1: Confirm middleware does not block the game**

Read `lib/supabase/middleware.ts`. Confirm it only redirects `/admin/*` (or unauthenticated admin) and leaves `/game/*` and `/api/game/*` public. If it would redirect `/game`, add an early `return` for paths starting with `/game` and `/api/game`. Record what you found in the commit message.

- [ ] **Step 2: Write the layout**

Create `app/game/layout.tsx`:

```tsx
import type { ReactNode } from "react"
import { GameNav } from "./components/game-nav"

export default function GameLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-amber-50 to-sky-50">
      <main className="mx-auto max-w-md px-4 pb-20 pt-4">{children}</main>
      <GameNav />
    </div>
  )
}
```

- [ ] **Step 3: Verify build**

Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add app/game/layout.tsx lib/supabase/middleware.ts
git commit -m "feat: add game layout and confirm middleware leaves /game public"
```

---

### Task 14: Login + recovery page

**Files:**
- Create: `app/game/page.tsx`

This is the entry point (QR target). It auto-logs-in returning devices, offers nickname signup, and a recovery flow.

- [ ] **Step 1: Write the page**

Create `app/game/page.tsx`:

```tsx
"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getDeviceToken, gamePost, gameGet } from "@/lib/game/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function GameLoginPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState("")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [mode, setMode] = useState<"login" | "recover">("login")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [welcomeCode, setWelcomeCode] = useState<string | null>(null)

  // If this browser already has a session, skip straight to the raid.
  useEffect(() => {
    gameGet("/api/game/auth/me")
      .then(() => router.replace("/game/raid"))
      .catch(() => setLoading(false))
  }, [router])

  async function handleLogin() {
    setError("")
    try {
      const res = await gamePost("/api/game/auth/login", {
        nickname: nickname.trim(),
        deviceToken: getDeviceToken(),
      })
      if (res.isNew) {
        setWelcomeCode(res.user.recoveryCode)
      } else {
        router.replace("/game/raid")
      }
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function handleRecover() {
    setError("")
    try {
      await gamePost("/api/game/auth/recover", {
        recoveryCode: recoveryCode.trim(),
        deviceToken: getDeviceToken(),
      })
      router.replace("/game/raid")
    } catch (e: any) {
      setError(e.message)
    }
  }

  if (loading) return <p className="py-20 text-center text-slate-500">Đang tải…</p>

  if (welcomeCode) {
    return (
      <div className="space-y-4 py-10 text-center">
        <h1 className="text-2xl font-extrabold text-fuchsia-600">Chào mừng Triệu Hồi Sư!</h1>
        <p>Bạn nhận được 5 Vé Triệu Hồi và 1 Linh Thú khởi đầu.</p>
        <div className="rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 p-4">
          <p className="text-sm text-slate-600">Mã khôi phục tài khoản (lưu lại!)</p>
          <p className="text-2xl font-mono font-bold tracking-widest">{welcomeCode}</p>
        </div>
        <Button className="w-full" onClick={() => router.replace("/game/raid")}>
          Vào Raid Vua Ghẹ!
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5 py-8">
      <h1 className="text-center text-3xl font-extrabold text-fuchsia-600">RAID VUA GHẸ</h1>
      <p className="text-center text-slate-600">Triệu hồi Linh Thú, cùng nhau hạ gục Vua Ghẹ!</p>

      {mode === "login" ? (
        <div className="space-y-3">
          <Input
            placeholder="Nhập nickname của bạn"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <Button className="w-full" disabled={!nickname.trim()} onClick={handleLogin}>
            Bắt đầu chơi
          </Button>
          <button className="w-full text-sm text-slate-500 underline" onClick={() => setMode("recover")}>
            Khôi phục tài khoản cũ
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            placeholder="Nhập mã khôi phục (GHE-XXXXX)"
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value)}
          />
          <Button className="w-full" disabled={!recoveryCode.trim()} onClick={handleRecover}>
            Khôi phục
          </Button>
          <button className="w-full text-sm text-slate-500 underline" onClick={() => setMode("login")}>
            Quay lại đăng nhập
          </button>
        </div>
      )}

      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm build`, then `pnpm dev`. Open `http://localhost:3000/game` in a fresh browser profile.
Expected: see the login screen, enter a nickname → welcome screen shows a `GHE-XXXXX` code → "Vào Raid" navigates to `/game/raid`. Reloading `/game` auto-redirects to `/game/raid` (existing session).

- [ ] **Step 3: Commit**

```bash
git add app/game/page.tsx
git commit -m "feat: add game login and account recovery page"
```

---

### Task 15: Gacha page

**Files:**
- Create: `app/game/gacha/page.tsx`

- [ ] **Step 1: Write the page**

Create `app/game/gacha/page.tsx`:

```tsx
"use client"
import { useEffect, useState } from "react"
import { gameGet, gamePost } from "@/lib/game/client"
import { Button } from "@/components/ui/button"
import { RarityBadge } from "../components/rarity-badge"

interface Pulled {
  id: string; name: string; rarity: string; imageUrl: string | null; skillDesc: string | null
}

export default function GachaPage() {
  const [tickets, setTickets] = useState<number | null>(null)
  const [rolling, setRolling] = useState(false)
  const [pulled, setPulled] = useState<Pulled | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    gameGet("/api/game/auth/me")
      .then((r) => setTickets(r.user.summonTickets))
      .catch((e) => setError(e.message))
  }, [])

  async function roll() {
    setError("")
    setRolling(true)
    setPulled(null)
    try {
      // brief suspense before revealing
      await new Promise((r) => setTimeout(r, 900))
      const res = await gamePost("/api/game/gacha/roll")
      setPulled(res.creature)
      setIsNew(res.isNew)
      setTickets(res.remainingTickets)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRolling(false)
    }
  }

  return (
    <div className="space-y-5 py-4">
      <h1 className="text-2xl font-extrabold text-fuchsia-600">Triệu Hồi Linh Thú</h1>
      <p className="text-slate-600">
        Vé Triệu Hồi: <span className="font-bold">{tickets ?? "…"}</span>
      </p>

      <div className="flex min-h-48 items-center justify-center rounded-2xl border bg-white/70 p-6">
        {rolling ? (
          <p className="animate-pulse text-lg font-semibold text-fuchsia-500">Đang triệu hồi…</p>
        ) : pulled ? (
          <div className="text-center">
            {pulled.imageUrl ? (
              <img src={pulled.imageUrl} alt={pulled.name} className="mx-auto h-28 w-28 rounded-xl object-cover" />
            ) : (
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-xl bg-slate-100 text-4xl">🐾</div>
            )}
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className="font-bold">{pulled.name}</span>
              <RarityBadge rarity={pulled.rarity} />
            </div>
            {pulled.skillDesc && <p className="mt-1 text-sm text-slate-500">{pulled.skillDesc}</p>}
            <p className="mt-1 text-sm font-semibold text-emerald-600">
              {isNew ? "Linh Thú mới!" : "Đã có (trùng)"}
            </p>
          </div>
        ) : (
          <p className="text-slate-400">Bấm nút để triệu hồi!</p>
        )}
      </div>

      <Button
        className="w-full"
        disabled={rolling || (tickets ?? 0) < 1}
        onClick={roll}
      >
        {(tickets ?? 0) < 1 ? "Hết vé — mua hàng để nhận thêm" : "Triệu Hồi (1 vé)"}
      </Button>
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm build`, then visit `/game/gacha` while logged in.
Expected: ticket count shows; rolling reveals a creature and decrements tickets; at 0 tickets the button disables with the buy hint.

- [ ] **Step 3: Commit**

```bash
git add app/game/gacha/page.tsx
git commit -m "feat: add gacha roll page"
```

---

### Task 16: Collection page

**Files:**
- Create: `app/game/collection/page.tsx`

- [ ] **Step 1: Write the page**

Create `app/game/collection/page.tsx`:

```tsx
"use client"
import { useEffect, useState } from "react"
import { gameGet } from "@/lib/game/client"
import { RarityBadge } from "../components/rarity-badge"

interface Item {
  id: string; name: string; rarity: string; imageUrl: string | null
  skillDesc: string | null; owned: boolean
}

export default function CollectionPage() {
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    gameGet("/api/game/collection")
      .then((r) => setItems(r.items))
      .catch((e) => setError(e.message))
  }, [])

  const ownedCount = items.filter((i) => i.owned).length

  return (
    <div className="space-y-4 py-4">
      <h1 className="text-2xl font-extrabold text-fuchsia-600">Bộ Sưu Tập</h1>
      <p className="text-slate-600">
        Đã sưu tầm: <span className="font-bold">{ownedCount}/{items.length}</span>
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-2 gap-3">
        {items.map((c) => (
          <div key={c.id} className="rounded-xl border bg-white/70 p-3 text-center">
            {c.owned ? (
              c.imageUrl ? (
                <img src={c.imageUrl} alt={c.name} className="mx-auto h-24 w-24 rounded-lg object-cover" />
              ) : (
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-lg bg-slate-100 text-3xl">🐾</div>
              )
            ) : (
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-lg bg-slate-200 text-4xl text-slate-400">
                ?
              </div>
            )}
            <div className="mt-2 flex items-center justify-center gap-1">
              <span className="text-sm font-semibold">{c.owned ? c.name : "???"}</span>
              <RarityBadge rarity={c.rarity} />
            </div>
            {c.owned && c.skillDesc && (
              <p className="mt-1 text-xs text-slate-500">{c.skillDesc}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm build`, visit `/game/collection`.
Expected: a 2-column grid; owned creatures show image+name+skill, unowned show a `?` silhouette and `???`.

- [ ] **Step 3: Commit**

```bash
git add app/game/collection/page.tsx
git commit -m "feat: add collection page with silhouettes for unowned"
```

---

### Task 17: Raid page with live boss HP

**Files:**
- Create: `app/game/raid/page.tsx`

Uses the existing browser Supabase client (`lib/supabase/client.ts`) to subscribe to `game_boss` row changes so the HP bar updates live across all players.

- [ ] **Step 1: Confirm the browser Supabase client export**

Read `lib/supabase/client.ts`. Note the exported factory name (e.g. `createClient`). Use that exact name in the next step's import.

- [ ] **Step 2: Write the page**

Create `app/game/raid/page.tsx` (adjust the supabase import to match Step 1):

```tsx
"use client"
import { useEffect, useState } from "react"
import { gameGet, gamePost } from "@/lib/game/client"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { RarityBadge } from "../components/rarity-badge"

interface Creature { id: string; name: string; rarity: string; imageUrl: string | null }
interface Boss { id: string; name: string; maxHp: number; currentHp: number }

export default function RaidPage() {
  const [boss, setBoss] = useState<Boss | null>(null)
  const [creatures, setCreatures] = useState<Creature[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [attacksLeft, setAttacksLeft] = useState(0)
  const [fighting, setFighting] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    gameGet("/api/game/raid/state")
      .then((r) => {
        setBoss(r.boss)
        setCreatures(r.creatures)
        setAttacksLeft(r.attacksLeft)
        if (r.creatures[0]) setSelected(r.creatures[0].id)
      })
      .catch((e) => setError(e.message))
  }, [])

  // Live boss HP via Supabase Realtime.
  useEffect(() => {
    if (!boss) return
    const supabase = createClient()
    const channel = supabase
      .channel("boss-hp")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "game_boss", filter: `id=eq.${boss.id}` },
        (payload: any) => {
          setBoss((b) => (b ? { ...b, currentHp: payload.new.current_hp } : b))
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [boss?.id])

  async function fight() {
    if (!selected) return
    setError("")
    setFighting(true)
    setLog([])
    try {
      const res = await gamePost("/api/game/raid/attack", { creatureId: selected })
      // Reveal the battle log line-by-line (5–10s animation feel).
      for (const line of res.log) {
        setLog((l) => [...l, line])
        await new Promise((r) => setTimeout(r, 1200))
      }
      setAttacksLeft(res.attacksLeft)
      setBoss((b) => (b ? { ...b, currentHp: res.bossCurrentHp } : b))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setFighting(false)
    }
  }

  if (error && !boss) return <p className="py-20 text-center text-red-600">{error}</p>
  if (!boss) return <p className="py-20 text-center text-slate-500">Đang tải…</p>

  const pct = Math.max(0, (boss.currentHp / boss.maxHp) * 100)

  return (
    <div className="space-y-5 py-4">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-rose-600">{boss.name}</h1>
        <div className="mx-auto mt-2 flex h-28 w-28 items-center justify-center rounded-full bg-rose-100 text-6xl">
          🦀
        </div>
      </div>

      <div>
        <div className="h-5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-red-600 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-center text-sm text-slate-600">
          {boss.currentHp.toLocaleString()} / {boss.maxHp.toLocaleString()} ({pct.toFixed(1)}%)
        </p>
      </div>

      {boss.currentHp <= 0 ? (
        <p className="rounded-xl bg-emerald-100 p-4 text-center font-bold text-emerald-700">
          Vua Ghẹ đã bị hạ gục! 🎉
        </p>
      ) : (
        <>
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-600">Chọn Linh Thú:</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {creatures.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`flex w-24 shrink-0 flex-col items-center rounded-xl border-2 p-2 ${
                    selected === c.id ? "border-fuchsia-500 bg-fuchsia-50" : "border-transparent bg-white/70"
                  }`}
                >
                  {c.imageUrl ? (
                    <img src={c.imageUrl} alt={c.name} className="h-16 w-16 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-100 text-2xl">🐾</div>
                  )}
                  <span className="mt-1 truncate text-xs font-medium">{c.name}</span>
                  <RarityBadge rarity={c.rarity} />
                </button>
              ))}
              {creatures.length === 0 && (
                <p className="text-sm text-slate-400">Chưa có Linh Thú — hãy Triệu Hồi trước!</p>
              )}
            </div>
          </div>

          <p className="text-center text-sm text-slate-600">
            Lượt đánh còn lại hôm nay: <span className="font-bold">{attacksLeft}</span>
          </p>

          <Button
            className="w-full"
            disabled={fighting || !selected || attacksLeft < 1}
            onClick={fight}
          >
            {attacksLeft < 1 ? "Hết lượt — mua hàng để thêm lượt" : fighting ? "Đang chiến đấu…" : "CHIẾN ĐẤU!"}
          </Button>

          {log.length > 0 && (
            <div className="space-y-1 rounded-xl border bg-white/70 p-3 text-sm">
              {log.map((line, i) => (
                <p key={i} className="animate-in fade-in">{line}</p>
              ))}
            </div>
          )}
          {error && <p className="text-center text-sm text-red-600">{error}</p>}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify build + live HP check**

Run: `pnpm build`, then `pnpm dev`. Open `/game/raid` in two browsers logged in as different accounts. Attack from one.
Expected: the battle log reveals line-by-line, boss HP drops, and the OTHER browser's HP bar updates within ~1–2s without reload (Realtime). At 0 attacks left the button shows the buy hint.

- [ ] **Step 4: Commit**

```bash
git add app/game/raid/page.tsx
git commit -m "feat: add raid page with realtime boss HP and battle log"
```

---

### Task 18: Leaderboard page

**Files:**
- Create: `app/game/leaderboard/page.tsx`

- [ ] **Step 1: Write the page**

Create `app/game/leaderboard/page.tsx`:

```tsx
"use client"
import { useEffect, useState } from "react"
import { gameGet } from "@/lib/game/client"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface Row { nickname: string; damage: number }

function Board({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return <p className="py-6 text-center text-slate-400">Chưa có dữ liệu</p>
  return (
    <ol className="space-y-2">
      {rows.map((r, i) => (
        <li key={i} className="flex items-center justify-between rounded-lg border bg-white/70 px-3 py-2">
          <span className="flex items-center gap-2">
            <span className="w-6 text-center font-bold text-fuchsia-600">{i + 1}</span>
            <span className="font-medium">{r.nickname}</span>
          </span>
          <span className="font-mono text-sm">{r.damage.toLocaleString()}</span>
        </li>
      ))}
    </ol>
  )
}

export default function LeaderboardPage() {
  const [today, setToday] = useState<Row[]>([])
  const [allTime, setAllTime] = useState<Row[]>([])

  useEffect(() => {
    gameGet("/api/game/leaderboard").then((r) => {
      setToday(r.today)
      setAllTime(r.allTime)
    })
  }, [])

  return (
    <div className="space-y-4 py-4">
      <h1 className="text-2xl font-extrabold text-fuchsia-600">Bảng Xếp Hạng</h1>
      <Tabs defaultValue="today">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="today">Hôm Nay</TabsTrigger>
          <TabsTrigger value="all">Toàn Event</TabsTrigger>
        </TabsList>
        <TabsContent value="today"><Board rows={today} /></TabsContent>
        <TabsContent value="all"><Board rows={allTime} /></TabsContent>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm build`, visit `/game/leaderboard`.
Expected: two tabs; after attacking, your nickname appears with cumulative damage. The `Tabs` import path must match the existing shadcn component at `components/ui/tabs`.

- [ ] **Step 3: Commit**

```bash
git add app/game/leaderboard/page.tsx
git commit -m "feat: add leaderboard page (today + all-time tabs)"
```

---

### Task 19: Shop + gift-code page

**Files:**
- Create: `app/game/shop/page.tsx`

- [ ] **Step 1: Write the page**

Create `app/game/shop/page.tsx`:

```tsx
"use client"
import { useEffect, useState } from "react"
import { gameGet, gamePost } from "@/lib/game/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Reward {
  id: string; name: string; shellCost: number; requiresPurchase: boolean; stock: number | null
}

export default function ShopPage() {
  const [shells, setShells] = useState(0)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [code, setCode] = useState("")
  const [msg, setMsg] = useState("")
  const [error, setError] = useState("")

  async function load() {
    const r = await gameGet("/api/game/shop")
    setShells(r.shells)
    setRewards(r.rewards)
  }
  useEffect(() => {
    load().catch((e) => setError(e.message))
  }, [])

  async function redeem(reward: Reward) {
    setError(""); setMsg("")
    try {
      const res = await gamePost("/api/game/shop/redeem", { rewardId: reward.id })
      setMsg(`Đổi thành công "${res.rewardName}". Mã: ${res.code} — đưa mã này tại quầy!`)
      setShells(res.remainingShells)
      load().catch(() => {})
    } catch (e: any) {
      setError(e.message)
    }
  }

  async function useGiftCode() {
    setError(""); setMsg("")
    try {
      const res = await gamePost("/api/game/giftcode/redeem", { code: code.trim() })
      const parts = []
      if (res.grantedTickets) parts.push(`+${res.grantedTickets} Vé`)
      if (res.grantedAttacks) parts.push(`+${res.grantedAttacks} lượt đánh`)
      setMsg(`Nhập mã thành công: ${parts.join(", ")}`)
      setCode("")
    } catch (e: any) {
      setError(e.message)
    }
  }

  return (
    <div className="space-y-5 py-4">
      <h1 className="text-2xl font-extrabold text-fuchsia-600">Cửa Hàng Đổi Thưởng</h1>
      <p className="text-slate-600">Vỏ Ghẹ: <span className="font-bold">{shells}</span></p>

      <div className="rounded-xl border bg-white/70 p-3">
        <p className="mb-2 text-sm font-semibold">Có mã quà tặng khi mua hàng?</p>
        <div className="flex gap-2">
          <Input placeholder="PURCHASE-XXXXX" value={code} onChange={(e) => setCode(e.target.value)} />
          <Button disabled={!code.trim()} onClick={useGiftCode}>Nhập</Button>
        </div>
      </div>

      <div className="space-y-2">
        {rewards.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-xl border bg-white/70 p-3">
            <div>
              <p className="font-semibold">{r.name}</p>
              <p className="text-sm text-slate-500">
                {r.shellCost} Vỏ Ghẹ
                {r.stock !== null && ` · còn ${r.stock}`}
                {r.requiresPurchase && " · cần mã mua hàng"}
              </p>
            </div>
            <Button
              size="sm"
              disabled={r.requiresPurchase || shells < r.shellCost || (r.stock !== null && r.stock <= 0)}
              onClick={() => redeem(r)}
            >
              Đổi
            </Button>
          </div>
        ))}
      </div>

      {msg && <p className="rounded-lg bg-emerald-100 p-3 text-sm text-emerald-700">{msg}</p>}
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm build`, visit `/game/shop` with shells and a seeded reward.
Expected: reward list shows; redeeming yields a `REWARD-XXXXX` code message and lowers shells; entering `PURCHASE-TEST1` grants tickets. The `Input` import path must match `components/ui/input`.

- [ ] **Step 3: Commit**

```bash
git add app/game/shop/page.tsx
git commit -m "feat: add shop and gift-code redemption page"
```

---

## Self-Review Notes

**Spec coverage (Plan 2 portion):**
- Gacha + animation (spec §"Gacha") → Tasks 3, 15.
- Collection with silhouettes (spec §"Bộ sưu tập") → Tasks 4, 16.
- Choose creature + roll stats + combat simulation + battle log (spec §"Chuẩn bị/Mô phỏng chiến đấu") → Tasks 6, 17.
- Shared boss + live HP bar (spec §"Raid Vua Ghẹ") → Tasks 1 (realtime), 5, 6, 17.
- Damage→shells with cap (spec §"Công thức thưởng") → Task 6 (uses Plan 1 `damageToShells`).
- Leaderboard today + all-time (spec §"Leaderboard") → Tasks 1, 7, 18.
- Reward shop + unique redeem code (spec §"Cửa hàng/Redeem") → Tasks 8, 19.
- Gift-code redemption / sales integration (spec §"Tích hợp bán hàng") → Tasks 9, 19.
- Anti-farm quota enforcement (spec §5) → Task 6 (429 on quota; gift-code restores attacks).

**Type/name consistency:** API field names returned to the client (`remainingTickets`, `attacksLeft`, `bossCurrentHp`, `shellsEarned`, `recoveryCode`) are used verbatim in the pages. `createAdminClient` (server) vs `createClient` (browser, Task 17 Step 1 confirms the export) are kept distinct.

**Deferred to Plan 3:** admin player view + manual account restore, redeem CLAIM, gift-code creation UI, creature image upload, boss create/reset. The seed rewards/gift codes used for manual testing here are created via SQL; Plan 3 adds the admin UI to manage them.

**Open follow-ups (not blockers):** gacha and battle "animations" are minimal (suspense delay + line-by-line log). Polish with the frontend-design skill during execution if time allows — the data contracts won't change.
```
