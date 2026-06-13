# RAID VUA GHẸ — Game Event Design

**Date:** 2026-06-13
**Status:** Approved (design phase)
**Author:** brainstorm session với Trong NT

## 1. Mục tiêu & bối cảnh

Game web chạy trên điện thoại cho khách tại booth lễ hội cosplay/anime. Khách quét QR → chơi gacha sưu tập Linh Thú → cùng nhau raid boss "Vua Ghẹ" → nhận Vỏ Ghẹ → đổi thưởng tại quầy.

Mục tiêu kinh doanh:
- Thu hút người đi ngang quét QR.
- Tạo cảm giác gacha / sưu tập / raid boss tập thể.
- Phễu bán hàng: khuyến khích mua hàng để nhận thêm lượt chơi.
- **Không phát thưởng gây lỗ cho booth** (ràng buộc cứng).
- Vận hành gọn trong event 1–3 ngày, ~50 khách đồng thời.

## 2. Tích hợp vào hệ thống hiện tại

Game sống chung trong Next.js app hiện tại — **không tách app, không thêm stack mới.**

### Tái dùng
- **DB:** Supabase Postgres đang chạy (thêm bảng game, không đụng bảng cũ).
- **Realtime:** Supabase Realtime push thanh máu boss live cho mọi client (không polling).
- **Admin auth:** JWT custom có sẵn (`lib/jwt.ts`, `lib/auth.ts`, `middleware.ts`). Admin game gác chung cơ chế `/admin/*`.
- **UI:** shadcn/Radix + Tailwind có sẵn.
- **Storage ảnh Linh Thú:** R2 (`lib/r2/`).

### Linh Thú
Đứng độc lập (ảnh + metadata riêng), **không** gắn `product_id`. "Lấy cảm hứng" từ sản phẩm thật về mặt visual thôi.

### Cấu trúc thư mục
```
app/game/                    # storefront công khai (khách quét QR)
  page.tsx                   # guest login bằng nickname
  gacha/                     # roll Linh Thú
  collection/                # bộ sưu tập
  raid/                      # chọn Linh Thú → roll stats → đánh boss
  leaderboard/
  shop/                      # đổi Vỏ Ghẹ
app/admin/game/              # thêm vào admin shell (JWT có sẵn)
  players/                   # xem player
  redeem/                    # nhập mã reward → CLAIM
  giftcodes/                 # tạo PURCHASE code
  boss/                      # xem/reset boss
app/api/game/*               # API routes (mọi logic kinh tế ở server)
lib/game/
  economy.ts                 # single source of truth — MỌI con số
  gacha.ts                   # roll + pity
  combat.ts                  # roll stats + tính damage (server-side)
  rewards.ts                 # damage → Vỏ Ghẹ, đổi thưởng
```

## 3. Data model (Supabase Postgres)

Prefix `game_` để tách rõ với bảng e-commerce.

```
game_users
  id            uuid pk
  nickname      text
  device_token  text          # localStorage binding, soft anti multi-acc
  recovery_code text unique    # GHE-XXXX, hiện cho khách lúc tạo, dùng khôi phục acc
  shells        int  default 0
  summon_tickets int default 0
  total_damage  bigint default 0
  shells_today  int  default 0    # reset daily, dùng cho dailyShellCap
  attacks_today int  default 0    # reset daily, dùng cho dailyFreeAttacks
  last_reset    date
  created_at    timestamptz

game_creatures              # catalog Linh Thú (admin seed)
  id            uuid pk
  name          text
  rarity        text          # R | SR | SSR | UR
  image_url     text
  attack_bonus  numeric default 0
  crit_bonus    numeric default 0
  hp_bonus      numeric default 0
  skill_key     text          # map sang logic skill trong combat.ts
  skill_desc    text

game_user_creatures         # quan hệ sở hữu (nhiều-nhiều)
  user_id       uuid fk
  creature_id   uuid fk
  obtained_at   timestamptz

game_boss
  id            uuid pk
  name          text default 'Vua Ghẹ'
  max_hp        bigint
  current_hp    bigint
  is_active     bool
  created_at    timestamptz

game_attacks                # log mỗi lần đánh (audit + leaderboard daily)
  id            uuid pk
  user_id       uuid fk
  boss_id       uuid fk
  creature_id   uuid fk
  damage        bigint
  shells_earned int
  created_at    timestamptz

game_rewards                # catalog đổi thưởng (admin)
  id            uuid pk
  name          text
  shell_cost    int
  requires_purchase bool default false   # reward xịn có thể đòi mua hàng
  stock         int                      # nullable = vô hạn
  is_active     bool

game_redeems
  id            uuid pk
  user_id       uuid fk
  reward_id     uuid fk
  code          text unique   # REWARD-XXXXX
  status        text          # PENDING | CLAIMED
  created_at    timestamptz
  claimed_at    timestamptz

game_gift_codes             # PURCHASE code tặng vé/lượt khi mua hàng
  id            uuid pk
  code          text unique   # PURCHASE-XXXXX
  grants_tickets int default 0
  grants_attacks int default 0
  max_uses      int default 1
  used_count    int default 0
  is_active     bool
```

## 4. economy.ts — single source of truth

Mọi con số kinh tế đọc từ đây. **Không hard-code trong logic.**

```ts
export const ECONOMY = {
  newUser: {
    summonTickets: 5,
    guaranteedMinRarity: 'SR',   // acc mới đảm bảo ≥1 SR (pity)
  },
  gacha: {
    rates: { R: 0.70, SR: 0.24, SSR: 0.05, UR: 0.01 },
  },
  boss: {
    maxHp: 100_000_000,
  },
  combat: {
    statRange: { min: 1, max: 100 },   // ATK/CRIT/HP/LUCK roll
    baseDamageFormula: 'configurable',  // xem combat.ts
  },
  rewards: {
    damagePerShell: 1000,              // 1000 damage = 1 Vỏ Ghẹ
  },
  antiFarm: {
    dailyFreeAttacks: 10,              // lượt đánh free/ngày/acc
    dailyShellCap: 500,                // trần Vỏ Ghẹ nhận/ngày/acc
    attackCooldownSec: 0,              // tùy chọn, mặc định tắt
  },
} as const
```

## 5. Chống farm — phòng thủ nhiều tầng

Mối đe dọa & cách chặn:

| Mối đe dọa | Cách chặn |
|---|---|
| **Spam đánh boss** (1 acc đánh cả ngày) | `dailyFreeAttacks` quota/ngày. Hết → nghỉ hoặc nạp PURCHASE code. |
| **Hack client fake damage** | Roll stats + tính damage **100% server-side**. Client chỉ nhận kết quả + chạy animation. |
| **Đa tài khoản farm voucher** | (1) `device_token` localStorage — ma sát mềm. (2) Đổi thưởng **thủ công tại booth**, admin bấm CLAIM — phanh cuối. (3) Reward xịn `requires_purchase` + giá cao. |
| **Tính sai economy → rút cạn** | `dailyShellCap` backstop cứng. |

**Triết lý:** event vật lý, redemption tại quầy là phanh thật. Không cần kín như ngân hàng — chỉ cần đủ để leaderboard công bằng và Vỏ Ghẹ không vô hạn. Nạp lượt bằng mua hàng biến "hết lượt" thành lý do mua → đúng mục tiêu kinh doanh.

## 6. Luồng chính

### Guest login
1. Nhập nickname.
2. Client gửi `device_token` (tạo + lưu localStorage nếu chưa có).
3. Server tạo `game_user`, sinh `recovery_code` unique (`GHE-XXXX`), cấp `newUser.summonTickets` vé + roll pity đảm bảo ≥1 SR.
4. Hiện `recovery_code` cho khách: "Lưu mã này để khôi phục tài khoản nếu mất."

### Khôi phục tài khoản (localStorage mất / đổi máy)
Vì `device_token` chỉ bind trình duyệt (xóa storage / đổi máy = mất), cần đường khôi phục:

1. **Tự khôi phục:** màn login có nút "Khôi phục" → nhập `recovery_code` → server gắn `device_token` mới của trình duyệt hiện tại vào acc đó → vào lại nguyên trạng. Không cần admin.
2. **Admin khôi phục:** khách quên cả mã → admin search nickname trong panel, đối chiếu chỉ số (shells, total_damage) tại quầy xác minh đúng người → rebind. An toàn vì event vật lý, admin nhìn mặt xác nhận.

### Gacha
1. Trừ 1 vé.
2. Roll theo `gacha.rates` (server-side).
3. Thêm vào `game_user_creatures`. Trả về kết quả → client chạy animation mở gacha.

### Raid (đánh boss)
1. Check `attacks_today < dailyFreeAttacks`. Hết → chặn, gợi ý mua hàng.
2. Player chọn 1 Linh Thú.
3. **Server** roll ATK/CRIT/HP/LUCK (`statRange`), cộng bonus Linh Thú, áp skill (`skill_key`), tính tổng damage.
4. Gọi **Postgres RPC atomic** trừ HP boss:
   ```sql
   update game_boss set current_hp = greatest(0, current_hp - p_damage)
     where id = p_boss_id and is_active returning current_hp;
   ```
5. Tính Vỏ Ghẹ = `floor(damage / damagePerShell)`, cap bởi `dailyShellCap`.
6. Cập nhật `shells`, `total_damage`, `attacks_today`, `shells_today`. Ghi `game_attacks`.
7. Trả combat log (critical, skill, tổng damage) → client chạy animation 5–10s.
8. **Realtime:** mọi client subscribe `game_boss` thấy HP tụt live.

### Đổi thưởng
1. Check `shells >= reward.shell_cost` (+ `requires_purchase` nếu có).
2. Trừ Vỏ Ghẹ, giảm `stock`.
3. Sinh `code` duy nhất `REWARD-XXXXX`, lưu `game_redeems` status PENDING.
4. Khách tới booth → admin nhập code → CLAIM → status CLAIMED.

### PURCHASE code
1. Admin tạo `game_gift_codes` khi khách mua hàng.
2. Player nhập code → +vé / +lượt theo `grants_*`, tăng `used_count`.

## 7. Concurrency

50 đồng thời = nhẹ. Điểm nóng duy nhất = `game_boss.current_hp` (1 row, nhiều người ghi). Giải bằng **Postgres RPC atomic decrement** (mục 6). Không cần lock thủ công, không cần queue.

## 8. Giao diện

Anime / chibi / vui nhộn / màu tươi sáng. Mobile-first (khách dùng điện thoại). Linh Thú chưa sở hữu hiển thị silhouette/dấu hỏi trong collection.

## 9. Phạm vi MVP (event 1–3 ngày)

Build trước, theo đúng 10 mục spec gốc:
1. Guest login (nickname + device token)
2. Gacha (+ pity SR cho acc mới)
3. Bộ sưu tập Linh Thú
4. Chọn Linh Thú
5. Roll chỉ số (server-side)
6. Raid boss (RPC atomic + Realtime HP)
7. Nhận Vỏ Ghẹ (quota + cap)
8. Leaderboard (top hôm nay + toàn event)
9. Đổi thưởng (sinh code + admin CLAIM)
10. Admin dashboard (players, redeem, gift codes, boss)

## 10. Ngoài phạm vi (chừa cửa schema, KHÔNG build)

Guild, PvP, Skin, Achievement, Seasonal ranking, nhiều boss đồng thời. Schema thiết kế mở rộng được (vd `game_boss` đã hỗ trợ nhiều row / `is_active`) nhưng không implement giờ.
