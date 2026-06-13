# RAID VUA GHẸ — Plan 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the data layer, economy config, pure game logic (gacha/combat/rewards), and guest authentication + account recovery for the RAID VUA GHẸ booth event game.

**Architecture:** Game lives inside the existing Next.js app, reusing Supabase Postgres. Money-critical logic (gacha rolls, combat damage, reward conversion, daily caps) is implemented as **pure functions** in `lib/game/*` and unit-tested with Vitest. All economic numbers come from `lib/game/economy.ts` — never hard-coded. Server-side API routes use the service-role Supabase client (`createAdminClient()`) and issue a guest JWT cookie so a client can never act as another user.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase Postgres (`@supabase/supabase-js`), `jose` for JWT, Vitest for unit tests.

**Scope of this plan:** economy config, gacha/combat/rewards/daily-reset pure logic + tests, SQL migration for all `game_` tables + atomic boss-damage RPC + boss/creature seed, guest login API, account-recovery API. UI and admin dashboard are separate plans (Plan 2, Plan 3).

**Spec:** `docs/superpowers/specs/2026-06-13-raid-vua-ghe-game-design.md`

---

### Task 0: Add Vitest test harness

**Files:**
- Modify: `package.json` (add devDependency + `test` script)
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Vitest**

Run: `pnpm add -D vitest`
Expected: `vitest` appears under `devDependencies` in `package.json`.

- [ ] **Step 2: Add the test script**

Modify `package.json` `"scripts"` block — add the `test` line:

```json
  "scripts": {
    "build": "next build",
    "dev": "next dev",
    "lint": "next lint",
    "migrate:r2": "tsx --env-file=.env scripts/migrate-to-r2.ts",
    "start": "next start",
    "test": "vitest run"
  },
```

- [ ] **Step 3: Create the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["lib/game/**/*.test.ts"],
    environment: "node",
  },
})
```

- [ ] **Step 4: Verify the harness runs (no tests yet)**

Run: `pnpm test`
Expected: Vitest runs, reports "No test files found" (exit 0 is fine) — confirms config loads.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml vitest.config.ts
git commit -m "chore: add vitest for game logic unit tests"
```

---

### Task 1: Economy config — single source of truth

**Files:**
- Create: `lib/game/economy.ts`
- Test: `lib/game/economy.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/game/economy.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { ECONOMY } from "./economy"

describe("ECONOMY", () => {
  it("gacha rarity rates sum to exactly 1", () => {
    const { R, SR, SSR, UR } = ECONOMY.gacha.rates
    expect(R + SR + SSR + UR).toBeCloseTo(1, 10)
  })

  it("exposes anti-farm limits", () => {
    expect(ECONOMY.antiFarm.dailyFreeAttacks).toBeGreaterThan(0)
    expect(ECONOMY.antiFarm.dailyShellCap).toBeGreaterThan(0)
  })

  it("boss has positive max HP", () => {
    expect(ECONOMY.boss.maxHp).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `Cannot find module './economy'`.

- [ ] **Step 3: Write the economy config**

Create `lib/game/economy.ts`:

```ts
/**
 * Single source of truth for every economic number in the game.
 * NEVER hard-code these values anywhere else — import from here.
 */
export const ECONOMY = {
  newUser: {
    summonTickets: 5,
    // On signup the player is guaranteed one welcome creature of at least
    // this rarity (see lib/game/gacha.ts grantWelcomeCreature).
    guaranteedMinRarity: "SR" as Rarity,
  },
  gacha: {
    rates: { R: 0.7, SR: 0.24, SSR: 0.05, UR: 0.01 },
  },
  boss: {
    maxHp: 100_000_000,
    name: "Vua Ghẹ",
  },
  combat: {
    statRange: { min: 1, max: 100 }, // ATK / CRIT / HP / LUCK each roll in this range
    baseMultiplier: 50, // damage per effective ATK point
    critChanceFromStat: 0.005, // CRIT stat 1..100 -> 0.5%..50% base crit chance
    luckBonusPerPoint: 0.002, // each LUCK point adds to crit chance
    critMultiplier: 2, // damage multiplier on a critical hit
    hpDamageFactor: 5, // each effective HP point adds this much flat damage
  },
  rewards: {
    damagePerShell: 1000, // 1000 damage = 1 Vỏ Ghẹ
  },
  antiFarm: {
    dailyFreeAttacks: 10, // free boss attacks per account per day
    dailyShellCap: 500, // max shells an account can earn per day
    attackCooldownSec: 0, // optional cooldown between attacks; 0 = disabled
  },
} as const

export type Rarity = "R" | "SR" | "SSR" | "UR"
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS — 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/game/economy.ts lib/game/economy.test.ts
git commit -m "feat: add game economy config as single source of truth"
```

---

### Task 2: Gacha logic — rarity roll + pity welcome creature

**Files:**
- Create: `lib/game/gacha.ts`
- Test: `lib/game/gacha.test.ts`

Note: all functions take an injected `rand: () => number` (returns 0..1) so tests are deterministic. Production passes `Math.random`.

- [ ] **Step 1: Write the failing test**

Create `lib/game/gacha.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { rollRarity, rarityAtLeast } from "./gacha"

describe("rollRarity", () => {
  it("returns R for a roll in the bottom band", () => {
    expect(rollRarity(() => 0.0)).toBe("R") // 0 < 0.70
    expect(rollRarity(() => 0.69)).toBe("R")
  })
  it("returns SR in the SR band", () => {
    expect(rollRarity(() => 0.70)).toBe("SR") // 0.70 < 0.94
    expect(rollRarity(() => 0.93)).toBe("SR")
  })
  it("returns SSR in the SSR band", () => {
    expect(rollRarity(() => 0.94)).toBe("SSR") // 0.94 < 0.99
  })
  it("returns UR at the very top", () => {
    expect(rollRarity(() => 0.999)).toBe("UR")
  })
})

describe("rarityAtLeast", () => {
  it("ranks rarities correctly", () => {
    expect(rarityAtLeast("SR", "SR")).toBe(true)
    expect(rarityAtLeast("SSR", "SR")).toBe(true)
    expect(rarityAtLeast("R", "SR")).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `Cannot find module './gacha'`.

- [ ] **Step 3: Write the gacha logic**

Create `lib/game/gacha.ts`:

```ts
import { ECONOMY, type Rarity } from "./economy"

const RARITY_ORDER: Rarity[] = ["R", "SR", "SSR", "UR"]

/** True if `rarity` is the same or higher tier than `floor`. */
export function rarityAtLeast(rarity: Rarity, floor: Rarity): boolean {
  return RARITY_ORDER.indexOf(rarity) >= RARITY_ORDER.indexOf(floor)
}

/**
 * Roll a rarity using the configured gacha rates.
 * Bands are cumulative: R [0,0.70), SR [0.70,0.94), SSR [0.94,0.99), UR [0.99,1).
 */
export function rollRarity(rand: () => number): Rarity {
  const r = rand()
  const { R, SR, SSR } = ECONOMY.gacha.rates
  if (r < R) return "R"
  if (r < R + SR) return "SR"
  if (r < R + SR + SSR) return "SSR"
  return "UR"
}

/**
 * Pick a creature id of a given rarity from a pool, using `rand`.
 * Returns null if no creature of that rarity exists in the pool.
 */
export function pickCreatureOfRarity(
  pool: { id: string; rarity: Rarity }[],
  rarity: Rarity,
  rand: () => number
): string | null {
  const candidates = pool.filter((c) => c.rarity === rarity)
  if (candidates.length === 0) return null
  const idx = Math.floor(rand() * candidates.length)
  return candidates[idx].id
}

/**
 * Choose the welcome creature for a new account: guaranteed to be at least
 * ECONOMY.newUser.guaranteedMinRarity. Rolls normally, then floors up to the
 * guarantee if the roll came in under it.
 */
export function rollWelcomeRarity(rand: () => number): Rarity {
  const rolled = rollRarity(rand)
  const floor = ECONOMY.newUser.guaranteedMinRarity
  return rarityAtLeast(rolled, floor) ? rolled : floor
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS — all gacha tests green.

- [ ] **Step 5: Add tests for pool helpers**

Append to `lib/game/gacha.test.ts`:

```ts
import { pickCreatureOfRarity, rollWelcomeRarity } from "./gacha"

describe("pickCreatureOfRarity", () => {
  const pool = [
    { id: "a", rarity: "R" as const },
    { id: "b", rarity: "SR" as const },
    { id: "c", rarity: "SR" as const },
  ]
  it("picks a creature of the requested rarity", () => {
    expect(pickCreatureOfRarity(pool, "SR", () => 0)).toBe("b")
    expect(pickCreatureOfRarity(pool, "SR", () => 0.99)).toBe("c")
  })
  it("returns null when no creature of that rarity exists", () => {
    expect(pickCreatureOfRarity(pool, "UR", () => 0)).toBeNull()
  })
})

describe("rollWelcomeRarity", () => {
  it("floors a low roll up to the guaranteed minimum", () => {
    expect(rollWelcomeRarity(() => 0.0)).toBe("SR") // R roll -> floored to SR
  })
  it("keeps a roll already at or above the floor", () => {
    expect(rollWelcomeRarity(() => 0.999)).toBe("UR")
  })
})
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS — gacha pool + welcome tests green.

- [ ] **Step 7: Commit**

```bash
git add lib/game/gacha.ts lib/game/gacha.test.ts
git commit -m "feat: add gacha rarity roll, pool pick, and welcome pity logic"
```

---

### Task 3: Combat logic — stat roll + damage + skills

**Files:**
- Create: `lib/game/combat.ts`
- Test: `lib/game/combat.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/game/combat.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { rollStats, computeDamage } from "./combat"

const NO_BONUS = { attackBonus: 0, critBonus: 0, hpBonus: 0, skillKey: "" }

describe("rollStats", () => {
  it("rolls every stat within the configured range", () => {
    const stats = rollStats(() => 0) // 0 -> min (1)
    expect(stats).toEqual({ atk: 1, crit: 1, hp: 1, luck: 1 })
  })
  it("maps a max roll to the range maximum", () => {
    const stats = rollStats(() => 0.999999)
    expect(stats).toEqual({ atk: 100, crit: 100, hp: 100, luck: 100 })
  })
})

describe("computeDamage", () => {
  it("computes a non-crit base hit with no creature bonus", () => {
    // atk=10, crit=0 chance via rand=0.99 (no crit), hp=0, luck=0
    const result = computeDamage(
      { atk: 10, crit: 0, hp: 0, luck: 0 },
      NO_BONUS,
      { bossHpPct: 1 },
      () => 0.99
    )
    // base = 10 * 50 = 500, no crit, no skill, hp factor 0
    expect(result.isCrit).toBe(false)
    expect(result.total).toBe(500)
  })

  it("applies attack bonus from the creature", () => {
    const result = computeDamage(
      { atk: 10, crit: 0, hp: 0, luck: 0 },
      { ...NO_BONUS, attackBonus: 0.15 },
      { bossHpPct: 1 },
      () => 0.99
    )
    // base = round(10 * 50 * 1.15) = 575
    expect(result.total).toBe(575)
  })

  it("doubles damage on a guaranteed crit", () => {
    // crit stat 100 -> 0.5 base chance, force crit with rand=0
    const result = computeDamage(
      { atk: 10, crit: 100, hp: 0, luck: 0 },
      NO_BONUS,
      { bossHpPct: 1 },
      () => 0
    )
    expect(result.isCrit).toBe(true)
    expect(result.total).toBe(1000) // 500 * 2
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `Cannot find module './combat'`.

- [ ] **Step 3: Write the combat logic**

Create `lib/game/combat.ts`:

```ts
import { ECONOMY } from "./economy"

export interface Stats {
  atk: number
  crit: number
  hp: number
  luck: number
}

export interface CreatureBonus {
  attackBonus: number // e.g. 0.15 for +15% attack
  critBonus: number // added to crit chance, e.g. 0.10 for +10%
  hpBonus: number // e.g. 0.20 for +20% hp
  skillKey: string // "" = no active skill
}

export interface CombatContext {
  bossHpPct: number // boss current_hp / max_hp, 0..1 — used by some skills
}

export interface CombatResult {
  stats: Stats
  isCrit: boolean
  skillTriggered: boolean
  skillName: string
  total: number
  log: string[] // human-readable lines for the battle animation
}

function rollStat(rand: () => number): number {
  const { min, max } = ECONOMY.combat.statRange
  return min + Math.floor(rand() * (max - min + 1))
}

/** Roll the four battle stats. Each uses an independent draw from `rand`. */
export function rollStats(rand: () => number): Stats {
  return {
    atk: rollStat(rand),
    crit: rollStat(rand),
    hp: rollStat(rand),
    luck: rollStat(rand),
  }
}

/**
 * Apply an active skill. Returns extra flat damage plus a log line.
 * - dragon_triple: 10% chance (gated by `rand`) to triple the hit.
 * - crab_traitor: bonus damage scaling with the boss's remaining HP %.
 */
function applySkill(
  skillKey: string,
  baseDamage: number,
  ctx: CombatContext,
  rand: () => number
): { extra: number; triggered: boolean; name: string } {
  switch (skillKey) {
    case "dragon_triple": {
      const triggered = rand() < 0.1
      return { extra: triggered ? baseDamage * 2 : 0, triggered, name: "Rồng Phun Lửa" }
    }
    case "crab_traitor": {
      const extra = Math.round(baseDamage * ctx.bossHpPct)
      return { extra, triggered: extra > 0, name: "Phản Bội" }
    }
    default:
      return { extra: 0, triggered: false, name: "" }
  }
}

/**
 * Compute total damage for one attack. Pure: all randomness comes from `rand`.
 * Draw order: [crit check, then skill check] — keep stable for test determinism.
 */
export function computeDamage(
  stats: Stats,
  bonus: CreatureBonus,
  ctx: CombatContext,
  rand: () => number
): CombatResult {
  const c = ECONOMY.combat
  const log: string[] = []

  const effectiveAtk = stats.atk * c.baseMultiplier * (1 + bonus.attackBonus)
  const hpDamage = stats.hp * (1 + bonus.hpBonus) * c.hpDamageFactor
  let damage = Math.round(effectiveAtk + hpDamage)
  log.push(`Linh Thú lao tới! +${damage} damage`)

  const critChance =
    stats.crit * c.critChanceFromStat +
    bonus.critBonus +
    stats.luck * c.luckBonusPerPoint
  const isCrit = rand() < critChance
  if (isCrit) {
    damage = Math.round(damage * c.critMultiplier)
    log.push(`Critical Hit! x${c.critMultiplier}`)
  }

  const skill = applySkill(bonus.skillKey, damage, ctx, rand)
  if (skill.triggered) {
    damage += skill.extra
    log.push(`Kỹ năng kích hoạt: ${skill.name}! +${skill.extra} damage`)
  }

  log.push(`Tổng sát thương: ${damage}`)
  return {
    stats,
    isCrit,
    skillTriggered: skill.triggered,
    skillName: skill.name,
    total: damage,
    log,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS — combat tests green.

- [ ] **Step 5: Add a skill test**

Append to `lib/game/combat.test.ts`:

```ts
describe("computeDamage skills", () => {
  it("crab_traitor adds damage scaled by boss HP %", () => {
    const result = computeDamage(
      { atk: 10, crit: 0, hp: 0, luck: 0 },
      { attackBonus: 0, critBonus: 0, hpBonus: 0, skillKey: "crab_traitor" },
      { bossHpPct: 0.5 },
      () => 0.99 // no crit
    )
    // base 500, +50% boss hp => +250
    expect(result.skillTriggered).toBe(true)
    expect(result.total).toBe(750)
  })

  it("dragon_triple triples when its gate passes", () => {
    // rand sequence: first draw = crit check (0.99 -> no crit), second = skill (0.0 -> trigger)
    const draws = [0.99, 0.0]
    let i = 0
    const rand = () => draws[i++]
    const result = computeDamage(
      { atk: 10, crit: 0, hp: 0, luck: 0 },
      { attackBonus: 0, critBonus: 0, hpBonus: 0, skillKey: "dragon_triple" },
      { bossHpPct: 1 },
      rand
    )
    // base 500, +2*500 => 1500
    expect(result.skillTriggered).toBe(true)
    expect(result.total).toBe(1500)
  })
})
```

- [ ] **Step 6: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS — skill tests green.

- [ ] **Step 7: Commit**

```bash
git add lib/game/combat.ts lib/game/combat.test.ts
git commit -m "feat: add server-side combat stat roll, damage, and skill logic"
```

---

### Task 4: Rewards + daily reset logic

**Files:**
- Create: `lib/game/rewards.ts`
- Create: `lib/game/daily.ts`
- Test: `lib/game/rewards.test.ts`
- Test: `lib/game/daily.test.ts`

- [ ] **Step 1: Write the failing rewards test**

Create `lib/game/rewards.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { damageToShells } from "./rewards"

describe("damageToShells", () => {
  it("converts damage at the configured rate, flooring", () => {
    // 1000 damage = 1 shell
    expect(damageToShells(2500, 0)).toBe(2)
  })
  it("respects the daily shell cap", () => {
    // already earned 499 today, cap 500 -> at most 1 more
    expect(damageToShells(10_000_000, 499)).toBe(1)
  })
  it("returns 0 once the daily cap is reached", () => {
    expect(damageToShells(10_000_000, 500)).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `Cannot find module './rewards'`.

- [ ] **Step 3: Write the rewards logic**

Create `lib/game/rewards.ts`:

```ts
import { ECONOMY } from "./economy"

/**
 * Convert raw damage to shells, flooring by the configured rate and clamping
 * so the account never exceeds the daily shell cap.
 *
 * @param damage         damage dealt this attack
 * @param shellsToday    shells the account has already earned today
 * @returns shells to award for this attack (0..remaining cap)
 */
export function damageToShells(damage: number, shellsToday: number): number {
  const earned = Math.floor(damage / ECONOMY.rewards.damagePerShell)
  const remaining = Math.max(0, ECONOMY.antiFarm.dailyShellCap - shellsToday)
  return Math.min(earned, remaining)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS — rewards tests green.

- [ ] **Step 5: Write the failing daily-reset test**

Create `lib/game/daily.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { computeDailyReset } from "./daily"

describe("computeDailyReset", () => {
  it("returns a reset patch when last_reset is an earlier day", () => {
    const patch = computeDailyReset("2026-06-12", "2026-06-13")
    expect(patch).toEqual({ attacks_today: 0, shells_today: 0, last_reset: "2026-06-13" })
  })
  it("returns null when already reset today", () => {
    expect(computeDailyReset("2026-06-13", "2026-06-13")).toBeNull()
  })
  it("treats a missing last_reset as needing a reset", () => {
    const patch = computeDailyReset(null, "2026-06-13")
    expect(patch).toEqual({ attacks_today: 0, shells_today: 0, last_reset: "2026-06-13" })
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `pnpm test`
Expected: FAIL — `Cannot find module './daily'`.

- [ ] **Step 7: Write the daily-reset logic**

Create `lib/game/daily.ts`:

```ts
export interface DailyResetPatch {
  attacks_today: 0
  shells_today: 0
  last_reset: string
}

/**
 * Decide whether an account's daily counters need resetting.
 * Dates are ISO date strings (YYYY-MM-DD). Returns the patch to apply, or
 * null if the account was already reset on `today`.
 */
export function computeDailyReset(
  lastReset: string | null,
  today: string
): DailyResetPatch | null {
  if (lastReset === today) return null
  return { attacks_today: 0, shells_today: 0, last_reset: today }
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS — daily tests green.

- [ ] **Step 9: Commit**

```bash
git add lib/game/rewards.ts lib/game/rewards.test.ts lib/game/daily.ts lib/game/daily.test.ts
git commit -m "feat: add shell conversion with daily cap and daily-reset logic"
```

---

### Task 5: Database migration — game tables, boss/creature seed, atomic damage RPC

**Files:**
- Create: `scripts/021_create_game_tables.sql`
- Create: `scripts/022_seed_game_data.sql`

These follow the existing convention (numbered SQL in `scripts/`, run manually in the Supabase SQL editor).

- [ ] **Step 1: Write the schema migration**

Create `scripts/021_create_game_tables.sql`:

```sql
-- RAID VUA GHE — game tables (prefixed game_ to isolate from e-commerce schema)

create extension if not exists "pgcrypto";

create table if not exists game_users (
  id             uuid primary key default gen_random_uuid(),
  nickname       text not null,
  device_token   text not null,
  recovery_code  text unique not null,
  shells         int not null default 0,
  summon_tickets int not null default 0,
  total_damage   bigint not null default 0,
  shells_today   int not null default 0,
  attacks_today  int not null default 0,
  last_reset     date,
  created_at     timestamptz not null default now()
);
create index if not exists idx_game_users_device on game_users(device_token);
create index if not exists idx_game_users_total_damage on game_users(total_damage desc);

create table if not exists game_creatures (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  rarity        text not null check (rarity in ('R','SR','SSR','UR')),
  image_url     text,
  attack_bonus  numeric not null default 0,
  crit_bonus    numeric not null default 0,
  hp_bonus      numeric not null default 0,
  skill_key     text not null default '',
  skill_desc    text
);

create table if not exists game_user_creatures (
  user_id      uuid not null references game_users(id) on delete cascade,
  creature_id  uuid not null references game_creatures(id) on delete cascade,
  obtained_at  timestamptz not null default now(),
  primary key (user_id, creature_id)
);

create table if not exists game_boss (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Vua Ghẹ',
  max_hp      bigint not null,
  current_hp  bigint not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table if not exists game_attacks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references game_users(id) on delete cascade,
  boss_id       uuid not null references game_boss(id) on delete cascade,
  creature_id   uuid references game_creatures(id) on delete set null,
  damage        bigint not null,
  shells_earned int not null default 0,
  created_at    timestamptz not null default now()
);
create index if not exists idx_game_attacks_user_time on game_attacks(user_id, created_at desc);
create index if not exists idx_game_attacks_time on game_attacks(created_at desc);

create table if not exists game_rewards (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  shell_cost        int not null,
  requires_purchase boolean not null default false,
  stock             int,
  is_active         boolean not null default true
);

create table if not exists game_redeems (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references game_users(id) on delete cascade,
  reward_id   uuid not null references game_rewards(id) on delete cascade,
  code        text unique not null,
  status      text not null default 'PENDING' check (status in ('PENDING','CLAIMED')),
  created_at  timestamptz not null default now(),
  claimed_at  timestamptz
);

create table if not exists game_gift_codes (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,
  grants_tickets int not null default 0,
  grants_attacks int not null default 0,
  max_uses       int not null default 1,
  used_count     int not null default 0,
  is_active      boolean not null default true
);

-- Atomic boss damage: clamp at 0, only while active. Returns the new HP.
create or replace function game_deal_damage(p_boss_id uuid, p_damage bigint)
returns bigint
language plpgsql
as $$
declare
  new_hp bigint;
begin
  update game_boss
     set current_hp = greatest(0, current_hp - p_damage)
   where id = p_boss_id and is_active
   returning current_hp into new_hp;
  return new_hp;
end;
$$;
```

- [ ] **Step 2: Run the schema migration in Supabase**

Open the Supabase project → SQL Editor → paste the contents of `scripts/021_create_game_tables.sql` → Run.
Expected: "Success. No rows returned." All `game_*` tables and the `game_deal_damage` function now exist (verify under Table Editor / Database → Functions).

- [ ] **Step 3: Write the seed migration**

Create `scripts/022_seed_game_data.sql`:

```sql
-- Seed the boss and the starter creatures.

insert into game_boss (name, max_hp, current_hp, is_active)
values ('Vua Ghẹ', 100000000, 100000000, true);

insert into game_creatures (name, rarity, attack_bonus, crit_bonus, hp_bonus, skill_key, skill_desc) values
  ('Mèo Len',       'R',   0,    0.10, 0,    '',             '+10% tỉ lệ chí mạng'),
  ('Vịt Len',       'R',   0.05, 0,    0,    '',             '+5% tấn công'),
  ('Capybara Len',  'SR',  0,    0,    0.20, '',             '+20% HP'),
  ('Cá Mập Len',    'SR',  0.15, 0,    0,    '',             '+15% tấn công'),
  ('Rồng In 3D',    'SSR', 0.10, 0,    0,    'dragon_triple','10% cơ hội gây x3 damage'),
  ('Ghẹ Phản Bội',  'UR',  0,    0,    0,    'crab_traitor', 'Damage tăng theo % máu boss');
```

Note: `image_url` is left null here; Plan 3 (admin) adds image upload. The game renders a placeholder until then.

- [ ] **Step 4: Run the seed migration in Supabase**

SQL Editor → paste `scripts/022_seed_game_data.sql` → Run.
Expected: "Success." `select count(*) from game_creatures;` returns 6; `select count(*) from game_boss where is_active;` returns 1.

- [ ] **Step 5: Commit**

```bash
git add scripts/021_create_game_tables.sql scripts/022_seed_game_data.sql
git commit -m "feat: add game db schema, atomic damage rpc, and seed data"
```

---

### Task 6: Guest token helpers

**Files:**
- Create: `lib/game/guest-auth.ts`

The admin JWT helpers in `lib/jwt.ts` are reused, but guest tokens carry a different payload shape and cookie name. This file wraps that so API routes have a single import.

- [ ] **Step 1: Write the guest-auth helpers**

Create `lib/game/guest-auth.ts`:

```ts
import { cookies } from "next/headers"
import { signToken, verifyToken } from "@/lib/jwt"

export const GUEST_COOKIE = "game_token"

/** Sign a guest session token carrying the player's user id. */
export async function signGuestToken(userId: string): Promise<string> {
  return signToken({ userId, kind: "guest" })
}

/**
 * Read the current guest's user id from the game_token cookie.
 * Returns null when no valid guest token is present.
 */
export async function getGuestUserId(): Promise<string | null> {
  const store = await cookies()
  const token = store.get(GUEST_COOKIE)?.value
  if (!token) return null
  try {
    const payload = await verifyToken(token)
    if (payload.kind !== "guest" || typeof payload.userId !== "string") return null
    return payload.userId
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Verify it type-checks via build**

Run: `pnpm build`
Expected: build succeeds (note: `next.config.mjs` ignores TS errors, so also eyeball the file for typos — the import path `@/lib/jwt` must resolve).

- [ ] **Step 3: Commit**

```bash
git add lib/game/guest-auth.ts
git commit -m "feat: add guest session token helpers"
```

---

### Task 7: Guest login API

**Files:**
- Create: `app/api/game/auth/login/route.ts`
- Create: `app/api/game/auth/me/route.ts`

- [ ] **Step 1: Write the login route**

Create `app/api/game/auth/login/route.ts`:

```ts
import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { signGuestToken, GUEST_COOKIE } from "@/lib/game/guest-auth"
import { ECONOMY, type Rarity } from "@/lib/game/economy"
import { rollWelcomeRarity, pickCreatureOfRarity } from "@/lib/game/gacha"

function makeRecoveryCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789" // no ambiguous chars
  let code = ""
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return `GHE-${code}`
}

export async function POST(request: NextRequest) {
  try {
    const { nickname, deviceToken } = await request.json()
    if (!nickname || !deviceToken) {
      return NextResponse.json({ error: "Thiếu nickname hoặc deviceToken" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Returning device: reuse the existing account bound to this browser.
    const { data: existing } = await supabase
      .from("game_users")
      .select("*")
      .eq("device_token", deviceToken)
      .maybeSingle()

    let user = existing
    let welcomeCreatureId: string | null = null

    if (!user) {
      // New account: grant tickets + a guaranteed welcome creature.
      const { data: creatures } = await supabase
        .from("game_creatures")
        .select("id, rarity")
      const pool = (creatures ?? []) as { id: string; rarity: Rarity }[]
      const rarity = rollWelcomeRarity(Math.random)
      welcomeCreatureId =
        pickCreatureOfRarity(pool, rarity, Math.random) ??
        pickCreatureOfRarity(pool, "SR", Math.random)

      const { data: created, error } = await supabase
        .from("game_users")
        .insert({
          nickname,
          device_token: deviceToken,
          recovery_code: makeRecoveryCode(),
          summon_tickets: ECONOMY.newUser.summonTickets,
        })
        .select("*")
        .single()
      if (error || !created) {
        return NextResponse.json({ error: "Không tạo được tài khoản" }, { status: 500 })
      }
      user = created

      if (welcomeCreatureId) {
        await supabase
          .from("game_user_creatures")
          .insert({ user_id: user.id, creature_id: welcomeCreatureId })
      }
    }

    const token = await signGuestToken(user.id)
    const response = NextResponse.json({
      user: {
        id: user.id,
        nickname: user.nickname,
        shells: user.shells,
        summonTickets: user.summon_tickets,
        totalDamage: user.total_damage,
        recoveryCode: user.recovery_code,
      },
      isNew: !existing,
      welcomeCreatureId,
    })
    response.cookies.set(GUEST_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
    })
    return response
  } catch (error) {
    console.error("[game] login error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
```

- [ ] **Step 2: Write the "me" route**

Create `app/api/game/auth/me/route.ts`:

```ts
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getGuestUserId } from "@/lib/game/guest-auth"

export async function GET() {
  const userId = await getGuestUserId()
  if (!userId) return NextResponse.json({ user: null }, { status: 401 })

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from("game_users")
    .select("id, nickname, shells, summon_tickets, total_damage, recovery_code")
    .eq("id", userId)
    .maybeSingle()

  if (!user) return NextResponse.json({ user: null }, { status: 401 })
  return NextResponse.json({
    user: {
      id: user.id,
      nickname: user.nickname,
      shells: user.shells,
      summonTickets: user.summon_tickets,
      totalDamage: user.total_damage,
      recoveryCode: user.recovery_code,
    },
  })
}
```

- [ ] **Step 3: Verify the build compiles**

Run: `pnpm build`
Expected: build succeeds; `/api/game/auth/login` and `/api/game/auth/me` appear in the route list.

- [ ] **Step 4: Manually verify login creates an account**

Run the dev server (`pnpm dev`), then in a second terminal:

```bash
curl -i -X POST http://localhost:3000/api/game/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nickname":"TestPlayer","deviceToken":"dev-token-1"}'
```

Expected: HTTP 200, JSON body with `"isNew":true`, a `recoveryCode` like `GHE-XXXXX`, a non-null `welcomeCreatureId`, and a `Set-Cookie: game_token=...` header. Run the same curl again → `"isNew":false` and the SAME user id (device reuse).

- [ ] **Step 5: Commit**

```bash
git add app/api/game/auth/login/route.ts app/api/game/auth/me/route.ts
git commit -m "feat: add guest login and session-me API routes"
```

---

### Task 8: Account recovery API

**Files:**
- Create: `app/api/game/auth/recover/route.ts`

- [ ] **Step 1: Write the recovery route**

Create `app/api/game/auth/recover/route.ts`:

```ts
import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { signGuestToken, GUEST_COOKIE } from "@/lib/game/guest-auth"

export async function POST(request: NextRequest) {
  try {
    const { recoveryCode, deviceToken } = await request.json()
    if (!recoveryCode || !deviceToken) {
      return NextResponse.json({ error: "Thiếu mã khôi phục hoặc deviceToken" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: user } = await supabase
      .from("game_users")
      .select("*")
      .eq("recovery_code", recoveryCode.trim().toUpperCase())
      .maybeSingle()

    if (!user) {
      return NextResponse.json({ error: "Mã khôi phục không đúng" }, { status: 404 })
    }

    // Rebind this account to the current browser.
    await supabase
      .from("game_users")
      .update({ device_token: deviceToken })
      .eq("id", user.id)

    const token = await signGuestToken(user.id)
    const response = NextResponse.json({
      user: {
        id: user.id,
        nickname: user.nickname,
        shells: user.shells,
        summonTickets: user.summon_tickets,
        totalDamage: user.total_damage,
        recoveryCode: user.recovery_code,
      },
    })
    response.cookies.set(GUEST_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
    })
    return response
  } catch (error) {
    console.error("[game] recover error:", error)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `pnpm build`
Expected: build succeeds; `/api/game/auth/recover` appears in the route list.

- [ ] **Step 3: Manually verify recovery rebinds the account**

With the dev server running, using the `recoveryCode` returned from the Task 7 login test:

```bash
curl -i -X POST http://localhost:3000/api/game/auth/recover \
  -H "Content-Type: application/json" \
  -d '{"recoveryCode":"GHE-XXXXX","deviceToken":"dev-token-2"}'
```

Expected: HTTP 200, the SAME user id as the original account, fresh `Set-Cookie: game_token=...`. A bad code returns HTTP 404 `"Mã khôi phục không đúng"`.

- [ ] **Step 4: Commit**

```bash
git add app/api/game/auth/recover/route.ts
git commit -m "feat: add account recovery by recovery code"
```

---

## Self-Review Notes

**Spec coverage (Plan 1 portion):**
- Data model (spec §3) → Task 5 (all `game_` tables + `recovery_code` field).
- economy.ts (spec §4) → Task 1.
- Anti-farm daily caps (spec §5) → Task 4 (`damageToShells` cap, `computeDailyReset`); enforcement wired into the raid route in Plan 2.
- Combat server-side (spec §6) → Task 3.
- Atomic boss damage RPC (spec §6/§7) → Task 5 (`game_deal_damage`).
- Guest login + welcome pity (spec §6) → Task 7.
- Account recovery (spec §6) → Task 8.
- Gacha rates + pity (spec §6) → Tasks 2, 7.

**Deferred to later plans (not gaps):** gacha spend endpoint, raid attack endpoint (uses `computeDailyReset` + `damageToShells` + `game_deal_damage`), leaderboard, shop/redeem, all UI → **Plan 2**. Admin dashboard, creature image upload, gift-code creation → **Plan 3**.

**Combat formula** (open item from spec) is now locked in `ECONOMY.combat` + `computeDamage`. Tunable entirely via `economy.ts`.

**Middleware note for Plan 2:** confirm `lib/supabase/middleware.ts` does not redirect `/game/*` or `/api/game/*` (only `/admin/*` should be gated). Adjust if needed before shipping the public UI.
```
