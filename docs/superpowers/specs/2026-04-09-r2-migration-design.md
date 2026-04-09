# R2 Migration Design

**Date:** 2026-04-09  
**Goal:** Migrate image storage from Supabase Storage to Cloudflare R2 to eliminate egress fees.

## Context

Supabase locked the account due to egress overages. Short-term fixes (compression, cache-control) have been applied. This migration permanently removes Supabase as the image storage provider.

## Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Upload architecture | Server proxy (Next.js API routes) | Keeps R2 credentials server-side; files are small after compression (~200-500KB) |
| Migration strategy | Full migration — copy old images + update DB URLs | Clean break; no dual-URL handling needed |
| Serving | Direct from R2 `*.r2.dev` public URL | Free egress; no Vercel Image Optimization (stays `unoptimized: true`) |
| Bucket structure | Single R2 bucket, folder prefixes | Simpler than mirroring 2 Supabase buckets |

## Environment Variables

```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=https://<hash>.r2.dev
```

## New Files

### `lib/r2/client.ts`
Creates and exports an S3Client configured for Cloudflare R2 endpoint (`https://<ACCOUNT_ID>.r2.cloudflarestorage.com`). Uses `@aws-sdk/client-s3`.

### `lib/r2/storage.ts`
Three helpers:
- `uploadToR2(file: Buffer | Blob, key: string, contentType: string): Promise<string>` — uploads and returns public URL
- `deleteFromR2(key: string): Promise<void>` — deletes object by key
- `getR2Url(key: string): string` — constructs public URL from `R2_PUBLIC_URL` + key

Key format: `{folder}/{timestamp}-{random}.webp` where folder is `product-images`, `about-images`, or `site`.

### `app/api/upload/route.ts`
POST endpoint. Accepts `multipart/form-data` with:
- `file` — the image file
- `folder` — `"product-images"` | `"about-images"` | `"site"`

Returns `{ url: string }`. Protected by admin auth check (reads `admin_token` cookie, validates JWT). Replaces `/api/upload-about-image`.

### `app/api/delete-image/route.ts`
POST endpoint. Accepts JSON `{ url: string }`. Extracts key from URL and calls `deleteFromR2`. Protected by admin auth check.

### `scripts/migrate-to-r2.ts`
Node script run with `npx tsx scripts/migrate-to-r2.ts`. Steps:
1. Connect to Supabase (uses service role key via env)
2. Fetch all products with non-empty `images` arrays
3. Fetch all `about_images` rows
4. Fetch `site_settings` rows where key in `['home_hero_image', 'home_custom_order_image']`
5. For each Supabase image URL:
   - Download file as Buffer via `fetch()`
   - Detect content type from URL extension
   - Upload to R2 with matching folder prefix
   - Collect `{ oldUrl, newUrl }` mapping
6. Batch update DB:
   - `products`: update each row's `images` array replacing old URLs
   - `about_images`: update `image_url`
   - `site_settings`: update `value`
7. Log summary: N images migrated, N failed

Script is idempotent — skips URLs that are already R2 URLs (checks for `r2.dev` or `R2_PUBLIC_URL` prefix).

## Updated Files

### `components/admin/image-upload.tsx`
Replace all `supabase.storage` calls:
- `upload()` → `fetch('/api/upload', { method: 'POST', body: formData })`
- `remove()` → `fetch('/api/delete-image', { method: 'POST', body: JSON.stringify({ url }) })`
- Remove `getPublicUrl()` call — URL returned directly from `/api/upload`
- Remove `cacheControl` option (handled server-side)

### `components/admin/single-image-upload.tsx`
Same pattern as above.

### `components/admin/home-images-manager.tsx`
Same pattern. Folder: `"site"`.

### `components/admin/delete-product-button.tsx`
Replace `supabase.storage.from("product-images").remove(fileNames)` → call `/api/delete-image` for each URL.

### `app/api/upload-about-image/route.ts`
Rewrite to use `uploadToR2` instead of Supabase storage. Keep same request/response shape so `about-images-manager.tsx` doesn't need changes.

### `next.config.mjs`
Keep `images: { unoptimized: true }`. No remotePatterns needed since optimization is disabled.

## Dependencies

Add: `@aws-sdk/client-s3`

No other new dependencies. `browser-image-compression` already installed.

## Auth on API Routes

Both `/api/upload` and `/api/delete-image` read the `admin_token` cookie and validate JWT using `lib/jwt.ts`. Return 401 if invalid. This matches the existing auth pattern in the codebase.
