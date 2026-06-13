# RAID VUA GHẸ — Plan 3: Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the admin tools needed to run the event: view players (with recovery codes for in-person restore), claim reward codes at the booth, create purchase gift codes, manage the reward catalog, and manage the boss + creatures.

**Architecture:** Admin pages live under `app/admin/game/*` and are protected by the existing `middleware.ts` (which guards all `/admin/*` with the `admin_token` JWT). Admin API routes under `app/api/admin/game/*` independently verify the admin JWT via `isAuthenticatedAdmin(request)` and use the service-role Supabase client (`createAdminClient()`). UI follows the existing admin pages' patterns and shadcn components.

**Tech Stack:** Next.js 14 App Router, React 19, TypeScript, Tailwind, shadcn/ui, Supabase service-role client.

**Depends on:** Plan 1 (Foundation) and Plan 2 (Gameplay) fully merged.

**Spec:** `docs/superpowers/specs/2026-06-13-raid-vua-ghe-game-design.md`

---

### Task 1: Admin players API

**Files:**
- Create: `app/api/admin/game/players/route.ts`

- [ ] **Step 1: Write the route**

Create `app/api/admin/game/players/route.ts`:

```ts
import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthenticatedAdmin } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? ""
  const supabase = createAdminClient()
  let query = supabase
    .from("game_users")
    .select("id, nickname, shells, summon_tickets, total_damage, recovery_code, created_at")
    .order("total_damage", { ascending: false })
    .limit(100)
  if (q) query = query.ilike("nickname", `%${q}%`)

  const { data } = await query
  return NextResponse.json({
    players: (data ?? []).map((u) => ({
      id: u.id,
      nickname: u.nickname,
      shells: u.shells,
      summonTickets: u.summon_tickets,
      totalDamage: Number(u.total_damage),
      recoveryCode: u.recovery_code,
    })),
  })
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm build`. With an admin login cookie jar (`admin_token`):

```bash
curl -s "http://localhost:3000/api/admin/game/players?q=Test" -b admin-cookies.txt
```

Expected: HTTP 200 with `players` array including `recoveryCode`. Without the admin cookie, HTTP 401.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/game/players/route.ts
git commit -m "feat: add admin players list API"
```

---

### Task 2: Admin players page

**Files:**
- Create: `app/admin/game/players/page.tsx`

- [ ] **Step 1: Write the page**

Create `app/admin/game/players/page.tsx`:

```tsx
"use client"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Player {
  id: string; nickname: string; shells: number; summonTickets: number
  totalDamage: number; recoveryCode: string
}

export default function AdminPlayersPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [q, setQ] = useState("")

  async function load() {
    const res = await fetch(`/api/admin/game/players?q=${encodeURIComponent(q)}`, {
      credentials: "include",
    })
    const data = await res.json()
    setPlayers(data.players ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Người Chơi</h1>
      <div className="flex gap-2">
        <Input placeholder="Tìm theo nickname" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button onClick={load}>Tìm</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="p-2">Nickname</th>
              <th className="p-2">Vỏ Ghẹ</th>
              <th className="p-2">Vé</th>
              <th className="p-2">Tổng Damage</th>
              <th className="p-2">Mã khôi phục</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-2 font-medium">{p.nickname}</td>
                <td className="p-2">{p.shells}</td>
                <td className="p-2">{p.summonTickets}</td>
                <td className="p-2">{p.totalDamage.toLocaleString()}</td>
                <td className="p-2 font-mono">{p.recoveryCode}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {players.length === 0 && <p className="p-4 text-center text-slate-400">Không có người chơi</p>}
      </div>
      <p className="text-sm text-slate-500">
        Khôi phục acc cho khách: tìm nickname, đối chiếu chỉ số, đọc <b>Mã khôi phục</b> cho khách nhập trên điện thoại.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm build`, log into admin, visit `/admin/game/players`.
Expected: table of players sorted by total damage; search filters by nickname; recovery codes visible.

- [ ] **Step 3: Commit**

```bash
git add app/admin/game/players/page.tsx
git commit -m "feat: add admin players page with recovery codes"
```

---

### Task 3: Redeem lookup + claim API

**Files:**
- Create: `app/api/admin/game/redeem/route.ts`

- [ ] **Step 1: Write the route**

Create `app/api/admin/game/redeem/route.ts`:

```ts
import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthenticatedAdmin } from "@/lib/admin-auth"

// GET: look up a redeem by code. POST: mark it CLAIMED.
export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const code = request.nextUrl.searchParams.get("code")?.trim().toUpperCase()
  if (!code) return NextResponse.json({ error: "Thiếu mã" }, { status: 400 })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("game_redeems")
    .select("id, code, status, created_at, claimed_at, game_users(nickname), game_rewards(name)")
    .eq("code", code)
    .maybeSingle()
  if (!data) return NextResponse.json({ error: "Không tìm thấy mã" }, { status: 404 })

  return NextResponse.json({
    redeem: {
      id: data.id,
      code: data.code,
      status: data.status,
      nickname: (data as any).game_users?.nickname ?? "?",
      rewardName: (data as any).game_rewards?.name ?? "?",
      claimedAt: data.claimed_at,
    },
  })
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { code } = await request.json()
  if (!code) return NextResponse.json({ error: "Thiếu mã" }, { status: 400 })

  const supabase = createAdminClient()
  // Guarded claim: only flips PENDING -> CLAIMED, never double-claims.
  const { data } = await supabase
    .from("game_redeems")
    .update({ status: "CLAIMED", claimed_at: new Date().toISOString() })
    .eq("code", code.trim().toUpperCase())
    .eq("status", "PENDING")
    .select("id")
    .maybeSingle()
  if (!data) {
    return NextResponse.json({ error: "Mã không tồn tại hoặc đã CLAIMED" }, { status: 409 })
  }
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm build`. Using a `REWARD-XXXXX` code created in Plan 2 testing:

```bash
curl -s "http://localhost:3000/api/admin/game/redeem?code=REWARD-XXXXX" -b admin-cookies.txt
curl -i -X POST http://localhost:3000/api/admin/game/redeem \
  -H "Content-Type: application/json" -b admin-cookies.txt \
  -d '{"code":"REWARD-XXXXX"}'
```

Expected: GET returns the redeem with nickname + reward + `status:"PENDING"`; POST returns `success:true`; a second POST returns HTTP 409.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/game/redeem/route.ts
git commit -m "feat: add admin redeem lookup and claim API"
```

---

### Task 4: Redeem claim page

**Files:**
- Create: `app/admin/game/redeem/page.tsx`

- [ ] **Step 1: Write the page**

Create `app/admin/game/redeem/page.tsx`:

```tsx
"use client"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Redeem {
  id: string; code: string; status: string; nickname: string; rewardName: string
}

export default function AdminRedeemPage() {
  const [code, setCode] = useState("")
  const [redeem, setRedeem] = useState<Redeem | null>(null)
  const [msg, setMsg] = useState("")
  const [error, setError] = useState("")

  async function lookup() {
    setError(""); setMsg(""); setRedeem(null)
    const res = await fetch(`/api/admin/game/redeem?code=${encodeURIComponent(code.trim())}`, {
      credentials: "include",
    })
    const data = await res.json()
    if (!res.ok) return setError(data.error)
    setRedeem(data.redeem)
  }

  async function claim() {
    setError(""); setMsg("")
    const res = await fetch("/api/admin/game/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code: redeem!.code }),
    })
    const data = await res.json()
    if (!res.ok) return setError(data.error)
    setMsg(`Đã CLAIM mã ${redeem!.code}`)
    setRedeem({ ...redeem!, status: "CLAIMED" })
  }

  return (
    <div className="max-w-md space-y-4 p-6">
      <h1 className="text-2xl font-bold">Đổi Thưởng</h1>
      <div className="flex gap-2">
        <Input placeholder="REWARD-XXXXX" value={code} onChange={(e) => setCode(e.target.value)} />
        <Button onClick={lookup}>Tra cứu</Button>
      </div>

      {redeem && (
        <div className="space-y-2 rounded-xl border p-4">
          <p>Người chơi: <b>{redeem.nickname}</b></p>
          <p>Phần thưởng: <b>{redeem.rewardName}</b></p>
          <p>Trạng thái: <b>{redeem.status}</b></p>
          <Button
            className="w-full"
            disabled={redeem.status !== "PENDING"}
            onClick={claim}
          >
            {redeem.status === "PENDING" ? "CLAIM" : "Đã CLAIMED"}
          </Button>
        </div>
      )}

      {msg && <p className="text-sm text-emerald-600">{msg}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm build`, visit `/admin/game/redeem`, look up a code, CLAIM it.
Expected: details show; CLAIM flips status to CLAIMED and disables the button.

- [ ] **Step 3: Commit**

```bash
git add app/admin/game/redeem/page.tsx
git commit -m "feat: add admin redeem claim page"
```

---

### Task 5: Gift codes API

**Files:**
- Create: `app/api/admin/game/giftcodes/route.ts`

- [ ] **Step 1: Write the route**

Create `app/api/admin/game/giftcodes/route.ts`:

```ts
import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthenticatedAdmin } from "@/lib/admin-auth"

function makeGiftCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return `PURCHASE-${code}`
}

export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("game_gift_codes")
    .select("id, code, grants_tickets, grants_attacks, max_uses, used_count, is_active")
    .order("code")
  return NextResponse.json({ codes: data ?? [] })
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await request.json()
  const grantsTickets = Number(body.grantsTickets) || 0
  const grantsAttacks = Number(body.grantsAttacks) || 0
  const maxUses = Number(body.maxUses) || 1
  if (grantsTickets <= 0 && grantsAttacks <= 0) {
    return NextResponse.json({ error: "Mã phải tặng ít nhất vé hoặc lượt" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const code = makeGiftCode()
  const { error } = await supabase.from("game_gift_codes").insert({
    code,
    grants_tickets: grantsTickets,
    grants_attacks: grantsAttacks,
    max_uses: maxUses,
    is_active: true,
  })
  if (error) return NextResponse.json({ error: "Không tạo được mã" }, { status: 500 })
  return NextResponse.json({ code })
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm build`.

```bash
curl -i -X POST http://localhost:3000/api/admin/game/giftcodes \
  -H "Content-Type: application/json" -b admin-cookies.txt \
  -d '{"grantsTickets":5,"maxUses":1}'
curl -s http://localhost:3000/api/admin/game/giftcodes -b admin-cookies.txt
```

Expected: POST returns a `PURCHASE-XXXXXX` code; GET lists it with `used_count:0`.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/game/giftcodes/route.ts
git commit -m "feat: add admin gift-code create/list API"
```

---

### Task 6: Gift codes page

**Files:**
- Create: `app/admin/game/giftcodes/page.tsx`

- [ ] **Step 1: Write the page**

Create `app/admin/game/giftcodes/page.tsx`:

```tsx
"use client"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Code {
  id: string; code: string; grants_tickets: number; grants_attacks: number
  max_uses: number; used_count: number; is_active: boolean
}

export default function AdminGiftCodesPage() {
  const [codes, setCodes] = useState<Code[]>([])
  const [tickets, setTickets] = useState("5")
  const [attacks, setAttacks] = useState("0")
  const [maxUses, setMaxUses] = useState("1")
  const [newCode, setNewCode] = useState("")
  const [error, setError] = useState("")

  async function load() {
    const res = await fetch("/api/admin/game/giftcodes", { credentials: "include" })
    const data = await res.json()
    setCodes(data.codes ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  async function create() {
    setError(""); setNewCode("")
    const res = await fetch("/api/admin/game/giftcodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        grantsTickets: Number(tickets),
        grantsAttacks: Number(attacks),
        maxUses: Number(maxUses),
      }),
    })
    const data = await res.json()
    if (!res.ok) return setError(data.error)
    setNewCode(data.code)
    load()
  }

  return (
    <div className="max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Mã Quà Tặng (Mua Hàng)</h1>

      <div className="grid grid-cols-3 gap-2">
        <label className="text-sm">Vé tặng
          <Input type="number" value={tickets} onChange={(e) => setTickets(e.target.value)} />
        </label>
        <label className="text-sm">Lượt đánh tặng
          <Input type="number" value={attacks} onChange={(e) => setAttacks(e.target.value)} />
        </label>
        <label className="text-sm">Số lần dùng
          <Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
        </label>
      </div>
      <Button onClick={create}>Tạo mã</Button>
      {newCode && (
        <p className="rounded-lg bg-emerald-100 p-3 font-mono text-emerald-700">Mã mới: {newCode}</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-slate-500">
            <th className="p-2">Mã</th><th className="p-2">Vé</th><th className="p-2">Lượt</th>
            <th className="p-2">Đã dùng / Tối đa</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="p-2 font-mono">{c.code}</td>
              <td className="p-2">{c.grants_tickets}</td>
              <td className="p-2">{c.grants_attacks}</td>
              <td className="p-2">{c.used_count} / {c.max_uses}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm build`, visit `/admin/game/giftcodes`. Create a code.
Expected: a new `PURCHASE-XXXXXX` appears in the list with `0 / N` usage.

- [ ] **Step 3: Commit**

```bash
git add app/admin/game/giftcodes/page.tsx
git commit -m "feat: add admin gift-codes page"
```

---

### Task 7: Rewards management API

**Files:**
- Create: `app/api/admin/game/rewards/route.ts`

- [ ] **Step 1: Write the route**

Create `app/api/admin/game/rewards/route.ts`:

```ts
import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthenticatedAdmin } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("game_rewards")
    .select("id, name, shell_cost, requires_purchase, stock, is_active")
    .order("shell_cost")
  return NextResponse.json({ rewards: data ?? [] })
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await request.json()
  if (!body.name || Number(body.shellCost) <= 0) {
    return NextResponse.json({ error: "Tên và giá Vỏ Ghẹ là bắt buộc" }, { status: 400 })
  }
  const supabase = createAdminClient()
  const { error } = await supabase.from("game_rewards").insert({
    name: body.name,
    shell_cost: Number(body.shellCost),
    requires_purchase: !!body.requiresPurchase,
    stock: body.stock === "" || body.stock == null ? null : Number(body.stock),
    is_active: true,
  })
  if (error) return NextResponse.json({ error: "Không tạo được phần thưởng" }, { status: 500 })
  return NextResponse.json({ success: true })
}

// Toggle active state (soft delete) by id.
export async function PATCH(request: NextRequest) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id, isActive } = await request.json()
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 })
  const supabase = createAdminClient()
  await supabase.from("game_rewards").update({ is_active: !!isActive }).eq("id", id)
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm build`.

```bash
curl -i -X POST http://localhost:3000/api/admin/game/rewards \
  -H "Content-Type: application/json" -b admin-cookies.txt \
  -d '{"name":"Voucher 10k","shellCost":100,"requiresPurchase":true}'
curl -s http://localhost:3000/api/admin/game/rewards -b admin-cookies.txt
```

Expected: POST returns success; GET lists the reward. The reward then appears in the player shop (`/api/game/shop`).

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/game/rewards/route.ts
git commit -m "feat: add admin rewards management API"
```

---

### Task 8: Rewards management page

**Files:**
- Create: `app/admin/game/rewards/page.tsx`

- [ ] **Step 1: Write the page**

Create `app/admin/game/rewards/page.tsx`:

```tsx
"use client"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Reward {
  id: string; name: string; shell_cost: number; requires_purchase: boolean
  stock: number | null; is_active: boolean
}

export default function AdminRewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([])
  const [name, setName] = useState("")
  const [cost, setCost] = useState("")
  const [stock, setStock] = useState("")
  const [requiresPurchase, setRequiresPurchase] = useState(false)
  const [error, setError] = useState("")

  async function load() {
    const res = await fetch("/api/admin/game/rewards", { credentials: "include" })
    const data = await res.json()
    setRewards(data.rewards ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  async function create() {
    setError("")
    const res = await fetch("/api/admin/game/rewards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, shellCost: cost, stock, requiresPurchase }),
    })
    const data = await res.json()
    if (!res.ok) return setError(data.error)
    setName(""); setCost(""); setStock(""); setRequiresPurchase(false)
    load()
  }

  async function toggle(r: Reward) {
    await fetch("/api/admin/game/rewards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: r.id, isActive: !r.is_active }),
    })
    load()
  }

  return (
    <div className="max-w-2xl space-y-4 p-6">
      <h1 className="text-2xl font-bold">Phần Thưởng</h1>

      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Tên phần thưởng" value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="number" placeholder="Giá (Vỏ Ghẹ)" value={cost} onChange={(e) => setCost(e.target.value)} />
        <Input type="number" placeholder="Tồn kho (trống = vô hạn)" value={stock} onChange={(e) => setStock(e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={requiresPurchase} onChange={(e) => setRequiresPurchase(e.target.checked)} />
          Cần mã mua hàng
        </label>
      </div>
      <Button onClick={create} disabled={!name || !cost}>Thêm phần thưởng</Button>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-slate-500">
            <th className="p-2">Tên</th><th className="p-2">Giá</th><th className="p-2">Tồn</th>
            <th className="p-2">Mua hàng?</th><th className="p-2">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {rewards.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="p-2 font-medium">{r.name}</td>
              <td className="p-2">{r.shell_cost}</td>
              <td className="p-2">{r.stock ?? "∞"}</td>
              <td className="p-2">{r.requires_purchase ? "Có" : "—"}</td>
              <td className="p-2">
                <button className="underline" onClick={() => toggle(r)}>
                  {r.is_active ? "Đang bật" : "Đã tắt"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm build`, visit `/admin/game/rewards`. Add a reward, toggle it.
Expected: reward appears; toggling flips active state; active rewards show in the player shop.

- [ ] **Step 3: Commit**

```bash
git add app/admin/game/rewards/page.tsx
git commit -m "feat: add admin rewards management page"
```

---

### Task 9: Boss + creatures management API

**Files:**
- Create: `app/api/admin/game/boss/route.ts`
- Create: `app/api/admin/game/creatures/route.ts`

- [ ] **Step 1: Write the boss route**

Create `app/api/admin/game/boss/route.ts`:

```ts
import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthenticatedAdmin } from "@/lib/admin-auth"
import { ECONOMY } from "@/lib/game/economy"

export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("game_boss")
    .select("id, name, max_hp, current_hp, is_active")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  return NextResponse.json({ boss: data })
}

// Reset the active boss back to full HP, or (re)create one if none exists.
export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await request.json().catch(() => ({}))
  const maxHp = Number(body.maxHp) > 0 ? Number(body.maxHp) : ECONOMY.boss.maxHp
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from("game_boss")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle()

  if (existing) {
    await supabase
      .from("game_boss")
      .update({ max_hp: maxHp, current_hp: maxHp })
      .eq("id", existing.id)
  } else {
    await supabase
      .from("game_boss")
      .insert({ name: ECONOMY.boss.name, max_hp: maxHp, current_hp: maxHp, is_active: true })
  }
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 2: Write the creatures route**

Create `app/api/admin/game/creatures/route.ts`:

```ts
import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthenticatedAdmin } from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("game_creatures")
    .select("id, name, rarity, image_url, attack_bonus, crit_bonus, hp_bonus, skill_key, skill_desc")
    .order("rarity")
  return NextResponse.json({ creatures: data ?? [] })
}

// Update an existing creature (image URL + tuning). Creatures are seeded in
// Plan 1; this lets the admin attach images and tweak bonuses for the event.
export async function PATCH(request: NextRequest) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 })
  const supabase = createAdminClient()
  const patch: Record<string, unknown> = {}
  if (body.imageUrl !== undefined) patch.image_url = body.imageUrl
  if (body.attackBonus !== undefined) patch.attack_bonus = Number(body.attackBonus)
  if (body.critBonus !== undefined) patch.crit_bonus = Number(body.critBonus)
  if (body.hpBonus !== undefined) patch.hp_bonus = Number(body.hpBonus)
  await supabase.from("game_creatures").update(patch).eq("id", body.id)
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 3: Verify build + manual check**

Run: `pnpm build`.

```bash
curl -s http://localhost:3000/api/admin/game/boss -b admin-cookies.txt
curl -i -X POST http://localhost:3000/api/admin/game/boss -b admin-cookies.txt \
  -H "Content-Type: application/json" -d '{}'
curl -s http://localhost:3000/api/admin/game/creatures -b admin-cookies.txt
```

Expected: boss GET returns the active boss; POST resets `current_hp` to `max_hp`; creatures GET lists the 6 seeded creatures.

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/game/boss/route.ts app/api/admin/game/creatures/route.ts
git commit -m "feat: add admin boss reset and creature update APIs"
```

---

### Task 10: Boss + creatures management page

**Files:**
- Create: `app/admin/game/boss/page.tsx`

Note: image attachment uses a URL field (paste an R2/CDN URL). Wiring a file-upload widget to the existing upload route is an optional follow-up; the data contract (`imageUrl`) won't change.

- [ ] **Step 1: Write the page**

Create `app/admin/game/boss/page.tsx`:

```tsx
"use client"
import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Boss { id: string; name: string; max_hp: number; current_hp: number }
interface Creature {
  id: string; name: string; rarity: string; image_url: string | null
}

export default function AdminBossPage() {
  const [boss, setBoss] = useState<Boss | null>(null)
  const [creatures, setCreatures] = useState<Creature[]>([])
  const [imgEdits, setImgEdits] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState("")

  async function load() {
    const [b, c] = await Promise.all([
      fetch("/api/admin/game/boss", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/admin/game/creatures", { credentials: "include" }).then((r) => r.json()),
    ])
    setBoss(b.boss)
    setCreatures(c.creatures ?? [])
  }
  useEffect(() => {
    load()
  }, [])

  async function resetBoss() {
    setMsg("")
    await fetch("/api/admin/game/boss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({}),
    })
    setMsg("Đã reset Vua Ghẹ về đầy máu.")
    load()
  }

  async function saveImage(id: string) {
    await fetch("/api/admin/game/creatures", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, imageUrl: imgEdits[id] ?? "" }),
    })
    load()
  }

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Vua Ghẹ</h1>
        {boss ? (
          <div className="mt-2 space-y-2 rounded-xl border p-4">
            <p>HP: {boss.current_hp.toLocaleString()} / {boss.max_hp.toLocaleString()}</p>
            <Button variant="destructive" onClick={resetBoss}>Reset về đầy máu</Button>
          </div>
        ) : (
          <Button onClick={resetBoss}>Tạo boss mới</Button>
        )}
        {msg && <p className="mt-2 text-sm text-emerald-600">{msg}</p>}
      </div>

      <div>
        <h2 className="text-xl font-bold">Linh Thú (ảnh)</h2>
        <div className="mt-2 space-y-3">
          {creatures.map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-lg border p-3">
              {c.image_url ? (
                <img src={c.image_url} alt={c.name} className="h-12 w-12 rounded object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded bg-slate-100">🐾</div>
              )}
              <span className="w-32 font-medium">{c.name} <span className="text-xs text-slate-400">{c.rarity}</span></span>
              <Input
                placeholder="URL ảnh"
                defaultValue={c.image_url ?? ""}
                onChange={(e) => setImgEdits((m) => ({ ...m, [c.id]: e.target.value }))}
              />
              <Button size="sm" onClick={() => saveImage(c.id)}>Lưu</Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build + manual check**

Run: `pnpm build`, visit `/admin/game/boss`. Reset the boss; paste an image URL for a creature and save.
Expected: boss HP resets to full (visible in `/game/raid` after reload / realtime); creature image saves and shows in the player collection.

- [ ] **Step 3: Commit**

```bash
git add app/admin/game/boss/page.tsx
git commit -m "feat: add admin boss reset and creature image page"
```

---

### Task 11: Admin navigation links

**Files:**
- Modify: the existing admin navigation/sidebar component (locate it first)

- [ ] **Step 1: Locate the admin nav**

Find the admin sidebar/nav. Search: look in `app/admin/layout.tsx` and `components/` for the existing links (Products, Categories, Settings, Timeline). Record the file path and the existing link pattern.

- [ ] **Step 2: Add the game section links**

Following the existing link pattern exactly, add a "Game (Raid Vua Ghẹ)" group linking to:
- `/admin/game/players` — Người chơi
- `/admin/game/redeem` — Đổi thưởng
- `/admin/game/giftcodes` — Mã quà tặng
- `/admin/game/rewards` — Phần thưởng
- `/admin/game/boss` — Vua Ghẹ & Linh Thú

Use the same component/styling the existing links use (do not invent a new nav style). Pick reasonable `lucide-react` icons (e.g. `Swords`, `Gift`, `Ticket`, `Trophy`, `Skull`).

- [ ] **Step 3: Verify build + manual check**

Run: `pnpm build`, log into admin.
Expected: the new game links appear in the admin nav and each navigates to its page.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add game section to admin navigation"
```

---

## Self-Review Notes

**Spec coverage (Plan 3 portion):**
- Admin players view: nickname, shells, tickets, total damage (spec §"Admin Dashboard / Người chơi") → Tasks 1, 2. Plus recovery codes for the spec §6 admin-restore flow.
- Redeem CLAIM by code, PENDING→CLAIMED (spec §"Admin Dashboard / Đổi thưởng", §"Redeem") → Tasks 3, 4.
- Gift-code creation for sales integration (spec §"Tích hợp bán hàng") → Tasks 5, 6.
- Reward catalog management (implied by spec §"Cửa hàng đổi thưởng" — rewards must be created) → Tasks 7, 8.
- Boss management + creature images (operationally required; creatures seeded imageless in Plan 1) → Tasks 9, 10.
- Admin nav wiring → Task 11.

**Auth consistency:** every admin API route calls `isAuthenticatedAdmin(request)` and returns 401 on failure (matching the codebase pattern). Pages rely on `middleware.ts` to gate `/admin/*` and send the `admin_token` cookie via `credentials: "include"`.

**Type/name consistency:** admin API JSON uses snake_case straight from the DB for management tables (`shell_cost`, `grants_tickets`, `current_hp`) and the pages read those exact names; player-facing APIs (Plan 2) use camelCase — the two surfaces are intentionally separate and never share a component.

**Login password note (pre-existing):** `app/api/auth/login/route.ts` currently accepts the literal password `admin123`. That is an existing project condition, out of scope for this game work, but worth flagging to the user before the event goes live in production.
```
