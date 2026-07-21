# Discount Visibility Toggle — Design

**Date:** 2026-07-21
**Status:** Approved

## Goal

Add an admin switch on the Settings page (`/admin/settings`) that globally controls
whether sale/discount pricing is shown on the storefront. When OFF, every place that
displays a discount is hidden and only the original price (`price`) is shown.

## Domain

- Discount = `products.promotion_price` (non-null and non-zero → on sale). Original = `price`.
- Config store: existing `site_settings` key/value table (RLS: public read, auth write).

## Storage

- New `site_settings` row: `key = 'show_discounts'`, `value = 'true' | 'false'`.
- Missing / null value → treated as `true` (preserves current behavior; no migration/seed required).

## Components

### Write path (admin only)
- `app/api/settings/route.ts` — `PUT` with body `{ show_discounts: boolean }`.
  - Guard with `isAuthenticatedAdmin` (`@/lib/admin-auth`) + `createAdminClient` (`@/lib/supabase/admin`).
  - Upserts the `show_discounts` row. Mirrors `app/api/timeline/route.ts`.

### Read path (storefront)
- `lib/site-settings.ts` → `getShowDiscounts(): Promise<boolean>`.
  - Server anon `createClient()` reads the key; returns `false` only when value === `'false'`, else `true`.

### Admin UI
- `app/admin/settings/page.tsx` (server): reads current value directly (same pattern as
  `app/admin/home-images/page.tsx`), passes to a client manager.
- `components/admin/site-settings-manager.tsx` (client): `Switch` "Hiện giá khuyến mãi",
  optimistic toggle → `PUT /api/settings`, "Đã lưu" feedback + revert on error.

### Storefront wiring (`showDiscount` prop threaded from each server page)
| File | Change (when `showDiscount === false`) |
|---|---|
| `components/product-card.tsx` | new prop `showDiscount` (default `true`); hide `-N%` badge + strikethrough, show only `price` |
| `app/products/[id]/ProductPageClient.tsx` | new prop `showDiscount`; hide promotion block, show only `price` |
| `app/products/[id]/page.tsx` | server: fetch flag, pass to `ProductPageClient` |
| `app/page.tsx` | skip the discounted-products query + hide the whole "Sản phẩm giảm giá" section; pass flag to featured cards |
| `app/products/page.tsx` | ignore `?discount=1`; pass flag to cards + `filter-sidebar` |
| `app/products/components/filter-sidebar.tsx` | new prop `showDiscount`; hide the discount filter toggle |

`app/loading.tsx` discounted-section skeleton: left as-is (transient, harmless).

## Error handling

- Admin toggle failure → revert switch state + alert (mirror `home-images-manager`).
- `getShowDiscounts` on read error → default `true` (fail open to current behavior).

## Testing

- Manual: `npm run build` + `npm run lint`. Toggle off → verify badges/strikethrough/section/filter
  gone across home, products list, product detail; toggle on → all restored.
- No pure-logic unit added (changes are conditional rendering + a thin key read).
