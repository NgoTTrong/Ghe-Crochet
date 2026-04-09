# R2 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Supabase Storage with Cloudflare R2 across all upload/delete/serve paths, then migrate existing images and update DB URLs.

**Architecture:** All uploads go through Next.js API routes (`/api/upload`, `/api/delete-image`) which use `@aws-sdk/client-s3` to talk to R2. Client components call these API routes via `fetch()` instead of using the Supabase client directly. A standalone migration script copies existing Supabase images to R2 and updates all DB references.

**Tech Stack:** `@aws-sdk/client-s3`, Cloudflare R2 (S3-compatible), `@supabase/supabase-js` (DB only, no longer for storage), `browser-image-compression` (already installed), `tsx` (migration script runner)

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `lib/r2/client.ts` | S3Client configured for R2 |
| Create | `lib/r2/storage.ts` | uploadToR2, deleteFromR2, getKeyFromUrl |
| Create | `app/api/upload/route.ts` | Unified upload endpoint |
| Create | `app/api/delete-image/route.ts` | Delete endpoint |
| Create | `scripts/migrate-to-r2.ts` | One-time migration script |
| Modify | `components/admin/image-upload.tsx` | Use /api/upload + /api/delete-image |
| Modify | `components/admin/single-image-upload.tsx` | Use /api/upload |
| Modify | `components/admin/home-images-manager.tsx` | Use /api/upload |
| Modify | `components/admin/delete-product-button.tsx` | Use /api/delete-image |
| Modify | `app/api/upload-about-image/route.ts` | Use R2 instead of Supabase storage |
| Modify | `package.json` | Add @aws-sdk/client-s3, tsx |
| Modify | `.env` | Add R2 env vars |

---

## Task 1: Add dependencies and env vars

**Files:**
- Modify: `package.json`
- Modify: `.env`

- [ ] **Add `@aws-sdk/client-s3` and `tsx` to package.json**

In `package.json` dependencies section, add:
```json
"@aws-sdk/client-s3": "^3.800.0",
```

In `package.json` devDependencies section, add:
```json
"tsx": "^4.19.2",
```

- [ ] **Add R2 env vars to `.env`**

Append to `.env`:
```
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_r2_access_key_id_here
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key_here
R2_BUCKET_NAME=your_bucket_name_here
R2_PUBLIC_URL=https://your_hash.r2.dev

# Migration script only (Supabase service role key for bypassing RLS)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

- [ ] **Install dependencies**

```bash
pnpm install
```

Expected: `@aws-sdk/client-s3` and `tsx` appear in `node_modules/`.

- [ ] **Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @aws-sdk/client-s3 and tsx dependencies"
```

---

## Task 2: Create R2 client

**Files:**
- Create: `lib/r2/client.ts`

- [ ] **Create `lib/r2/client.ts`**

```typescript
import { S3Client } from "@aws-sdk/client-s3"

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})
```

- [ ] **Commit**

```bash
git add lib/r2/client.ts
git commit -m "feat: add Cloudflare R2 S3 client"
```

---

## Task 3: Create R2 storage helpers

**Files:**
- Create: `lib/r2/storage.ts`

- [ ] **Create `lib/r2/storage.ts`**

```typescript
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { r2Client } from "./client"

export async function uploadToR2(
  body: Buffer | Uint8Array,
  key: string,
  contentType: string
): Promise<string> {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
  return `${process.env.R2_PUBLIC_URL}/${key}`
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    })
  )
}

export function getKeyFromUrl(url: string): string {
  // Extracts "product-images/123-abc.webp" from "https://<hash>.r2.dev/product-images/123-abc.webp"
  return new URL(url).pathname.slice(1)
}
```

- [ ] **Commit**

```bash
git add lib/r2/storage.ts
git commit -m "feat: add R2 upload/delete/key helpers"
```

---

## Task 4: Create unified upload API route

**Files:**
- Create: `app/api/upload/route.ts`

- [ ] **Create `app/api/upload/route.ts`**

```typescript
import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { uploadToR2 } from "@/lib/r2/storage"

export async function POST(request: NextRequest) {
  // Auth check
  const token = request.cookies.get("admin_token")?.value
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    await verifyToken(token)
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const folder = formData.get("folder") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const validFolders = ["product-images", "about-images", "site"]
    if (!folder || !validFolders.includes(folder)) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split(".").pop() ?? "webp"
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
    const contentType = file.type || "image/webp"

    const url = await uploadToR2(buffer, key, contentType)
    return NextResponse.json({ url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
```

- [ ] **Commit**

```bash
git add app/api/upload/route.ts
git commit -m "feat: add unified /api/upload route for R2"
```

---

## Task 5: Create delete image API route

**Files:**
- Create: `app/api/delete-image/route.ts`

- [ ] **Create `app/api/delete-image/route.ts`**

```typescript
import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"
import { deleteFromR2, getKeyFromUrl } from "@/lib/r2/storage"

export async function POST(request: NextRequest) {
  // Auth check
  const token = request.cookies.get("admin_token")?.value
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    await verifyToken(token)
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  try {
    const { url } = await request.json()
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 })
    }

    const key = getKeyFromUrl(url)
    await deleteFromR2(key)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
```

- [ ] **Commit**

```bash
git add app/api/delete-image/route.ts
git commit -m "feat: add /api/delete-image route for R2"
```

---

## Task 6: Update image-upload.tsx

**Files:**
- Modify: `components/admin/image-upload.tsx`

This component has three storage operations: `onDrop` (upload), `handleReplaceFile` (upload + delete old), `removeImage` (delete). All three need to be swapped.

- [ ] **Remove supabase import and createClient call**

Remove these lines:
```typescript
import { createClient } from "@/lib/supabase/client"
```
```typescript
const supabase = createClient()
```

- [ ] **Update `onDrop` — replace supabase upload with fetch**

Find the entire `uploadPromises` map block and replace with:

```typescript
const uploadPromises = acceptedFiles.map(async (file, index) => {
  const compressed = await imageCompression(file, compressionOptions)

  const formData = new FormData()
  formData.append("file", compressed, `image-${Date.now()}.webp`)
  formData.append("folder", "product-images")

  const res = await fetch("/api/upload", { method: "POST", body: formData })
  if (!res.ok) throw new Error("Upload failed")
  const { url } = await res.json()

  setUploadProgress(((index + 1) / acceptedFiles.length) * 100)
  return url as string
})
```

- [ ] **Update `removeImage` — replace supabase.storage.remove with fetch**

Replace the try block in `removeImage`:
```typescript
const removeImage = async (urlToRemove: string) => {
  if (disabled) return
  try {
    const res = await fetch("/api/delete-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: urlToRemove }),
    })
    if (!res.ok) throw new Error("Delete failed")
    onChange(value.filter((url) => url !== urlToRemove))
  } catch (error) {
    console.error("Delete error:", error)
    alert("Có lỗi xảy ra khi xóa ảnh")
  }
}
```

- [ ] **Update `handleReplaceFile` — replace supabase upload+delete with fetch**

Replace the try block in `handleReplaceFile`:
```typescript
setUploading(true)
try {
  const compressed = await imageCompression(file, compressionOptions)

  const formData = new FormData()
  formData.append("file", compressed, `image-${Date.now()}.webp`)
  formData.append("folder", "product-images")

  const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
  if (!uploadRes.ok) throw new Error("Upload failed")
  const { url: newUrl } = await uploadRes.json()

  // Delete old image
  const oldUrl = value[replacingIndex]
  await fetch("/api/delete-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: oldUrl }),
  })

  const newUrls = [...value]
  newUrls[replacingIndex] = newUrl
  onChange(newUrls)
} catch (error) {
  console.error("Replace error:", error)
  alert("Có lỗi xảy ra khi thay thế ảnh")
} finally {
  setUploading(false)
  setReplacingIndex(null)
  if (fileInputRef.current) fileInputRef.current.value = ""
}
```

- [ ] **Commit**

```bash
git add components/admin/image-upload.tsx
git commit -m "feat: migrate image-upload component to R2 API routes"
```

---

## Task 7: Update single-image-upload.tsx

**Files:**
- Modify: `components/admin/single-image-upload.tsx`

- [ ] **Remove supabase import and createClient call**

Remove:
```typescript
import { createClient } from "@/lib/supabase/client"
```
```typescript
const supabase = createClient()
```

- [ ] **Update `onDrop` upload block**

Replace the try block inside `onDrop`:
```typescript
try {
  const compressed = await imageCompression(file, compressionOptions)

  const formData = new FormData()
  formData.append("file", compressed, `image-${Date.now()}.webp`)
  formData.append("folder", "product-images")

  setUploadProgress(50)
  const res = await fetch("/api/upload", { method: "POST", body: formData })
  if (!res.ok) throw new Error("Upload failed")
  const { url } = await res.json()

  setUploadProgress(100)
  onChange(url)
} catch (error) {
  console.error("Upload error:", error)
  alert("Có lỗi xảy ra khi tải ảnh lên")
} finally {
  setUploading(false)
  setUploadProgress(0)
}
```

- [ ] **Replace the `removeImage` function (lines 78-93)**

```typescript
const removeImage = async () => {
  if (disabled || !value) return
  try {
    const res = await fetch("/api/delete-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: value }),
    })
    if (!res.ok) throw new Error("Delete failed")
    onChange(undefined)
  } catch (error) {
    console.error("Delete error:", error)
    alert("Có lỗi xảy ra khi xóa ảnh")
  }
}
```

- [ ] **Commit**

```bash
git add components/admin/single-image-upload.tsx
git commit -m "feat: migrate single-image-upload component to R2 API routes"
```

---

## Task 8: Update home-images-manager.tsx

**Files:**
- Modify: `components/admin/home-images-manager.tsx`

- [ ] **Remove supabase storage calls from `uploadImage`**

Find the `uploadImage` function. Replace the upload + getPublicUrl block (keep the `supabase.from('site_settings').upsert(...)` DB call — that stays on Supabase):

```typescript
const uploadImage = async (key: string, file: File) => {
  setUploading(key)
  setSaved(null)
  try {
    const formData = new FormData()
    formData.append("file", file, `${key}-${Date.now()}.${file.name.split(".").pop()}`)
    formData.append("folder", "site")

    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
    if (!uploadRes.ok) throw new Error("Upload failed")
    const { url: publicUrl } = await uploadRes.json()

    const { error: dbError } = await supabase
      .from("site_settings")
      .upsert({ key, value: publicUrl, updated_at: new Date().toISOString() })

    if (dbError) throw dbError

    setSettings((prev) => ({ ...prev, [key]: publicUrl }))
    setSaved(key)
    setTimeout(() => setSaved(null), 2500)
  } catch (err) {
    console.error("Upload error:", err)
    alert("Có lỗi khi tải ảnh lên")
  } finally {
    setUploading(null)
  }
}
```

Note: the `supabase` client stays in this component for DB operations only (site_settings table). Only the storage calls are removed.

- [ ] **Commit**

```bash
git add components/admin/home-images-manager.tsx
git commit -m "feat: migrate home-images-manager to R2 upload"
```

---

## Task 9: Update delete-product-button.tsx

**Files:**
- Modify: `components/admin/delete-product-button.tsx`

- [ ] **Replace supabase.storage.remove with /api/delete-image calls**

Find this block:
```typescript
if (imageFileNames.length > 0) {
  const { error: storageError } = await supabase.storage.from("product-images").remove(imageFileNames)
  console.log("[v0] Storage delete result:", storageError)
}
```

Replace with:
```typescript
if (product.images.length > 0) {
  await Promise.allSettled(
    product.images.map((url: string) =>
      fetch("/api/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })
    )
  )
}
```

Note: `Promise.allSettled` is intentional — if one delete fails, the product DB record still gets deleted. Storage cleanup failure shouldn't block product deletion.

- [ ] **Commit**

```bash
git add components/admin/delete-product-button.tsx
git commit -m "feat: migrate delete-product to use /api/delete-image"
```

---

## Task 10: Update upload-about-image API route

**Files:**
- Modify: `app/api/upload-about-image/route.ts`

- [ ] **Replace Supabase storage with R2**

Rewrite the entire file:
```typescript
import { type NextRequest, NextResponse } from "next/server"
import { uploadToR2 } from "@/lib/r2/storage"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = file.name.split(".").pop() ?? "jpg"
    const key = `about-images/about-${Date.now()}.${ext}`
    const contentType = file.type || "image/jpeg"

    const publicUrl = await uploadToR2(buffer, key, contentType)
    return NextResponse.json({ publicUrl })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

Note: Response shape stays `{ publicUrl }` (not `{ url }`) to keep `about-images-manager.tsx` working without changes.

- [ ] **Commit**

```bash
git add app/api/upload-about-image/route.ts
git commit -m "feat: migrate upload-about-image API to R2"
```

---

## Task 11: Create migration script

**Files:**
- Create: `scripts/migrate-to-r2.ts`

This script is run once locally after filling in R2 env vars. It copies all existing Supabase Storage images to R2 and updates DB URLs.

- [ ] **Create `scripts/migrate-to-r2.ts`**

```typescript
import { createClient } from "@supabase/supabase-js"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

// ---- Config ----
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

// ---- Helpers ----
function isSupabaseUrl(url: string): boolean {
  return url.includes(".supabase.co/storage/")
}

function isAlreadyR2(url: string): boolean {
  return url.startsWith(R2_PUBLIC_URL)
}

function inferFolder(url: string): string {
  if (url.includes("/about-images/")) return "about-images"
  if (url.includes("/site/")) return "site"
  return "product-images"
}

async function migrateImage(supabaseUrl: string): Promise<string> {
  if (isAlreadyR2(supabaseUrl)) {
    console.log(`  SKIP (already R2): ${supabaseUrl}`)
    return supabaseUrl
  }
  if (!isSupabaseUrl(supabaseUrl)) {
    console.log(`  SKIP (unknown origin): ${supabaseUrl}`)
    return supabaseUrl
  }

  const response = await fetch(supabaseUrl)
  if (!response.ok) throw new Error(`Failed to fetch ${supabaseUrl}: ${response.status}`)

  const buffer = Buffer.from(await response.arrayBuffer())
  const contentType = response.headers.get("content-type") || "image/jpeg"
  const ext = supabaseUrl.split(".").pop()?.split("?")[0] ?? "jpg"
  const folder = inferFolder(supabaseUrl)
  const filename = supabaseUrl.split("/").pop()?.split("?")[0] ?? `${Date.now()}.${ext}`
  const key = `${folder}/${filename}`

  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  )

  const newUrl = `${R2_PUBLIC_URL}/${key}`
  console.log(`  OK: ${supabaseUrl.split("/").pop()} → ${newUrl}`)
  return newUrl
}

// ---- Migration steps ----
async function migrateProducts() {
  console.log("\n=== Migrating products.images ===")
  const { data: products, error } = await supabase
    .from("products")
    .select("id, images")
    .not("images", "is", null)

  if (error) throw error

  let total = 0, failed = 0
  for (const product of products ?? []) {
    if (!product.images?.length) continue

    const newImages: string[] = []
    for (const url of product.images) {
      try {
        newImages.push(await migrateImage(url))
        total++
      } catch (e) {
        console.error(`  FAIL: ${url}`, e)
        newImages.push(url) // keep old URL on failure
        failed++
      }
    }

    await supabase.from("products").update({ images: newImages }).eq("id", product.id)
  }

  console.log(`Products: ${total} migrated, ${failed} failed`)
}

async function migrateAboutImages() {
  console.log("\n=== Migrating about_images.image_url ===")
  const { data: rows, error } = await supabase
    .from("about_images")
    .select("id, image_url")
    .not("image_url", "is", null)

  if (error) throw error

  let total = 0, failed = 0
  for (const row of rows ?? []) {
    try {
      const newUrl = await migrateImage(row.image_url)
      await supabase.from("about_images").update({ image_url: newUrl }).eq("id", row.id)
      total++
    } catch (e) {
      console.error(`  FAIL: ${row.image_url}`, e)
      failed++
    }
  }

  console.log(`About images: ${total} migrated, ${failed} failed`)
}

async function migrateSiteSettings() {
  console.log("\n=== Migrating site_settings image values ===")
  const imageKeys = ["home_hero_image", "home_custom_order_image"]

  const { data: rows, error } = await supabase
    .from("site_settings")
    .select("key, value")
    .in("key", imageKeys)
    .not("value", "is", null)

  if (error) throw error

  let total = 0, failed = 0
  for (const row of rows ?? []) {
    try {
      const newUrl = await migrateImage(row.value)
      await supabase.from("site_settings").update({ value: newUrl }).eq("key", row.key)
      total++
    } catch (e) {
      console.error(`  FAIL: ${row.key} = ${row.value}`, e)
      failed++
    }
  }

  console.log(`Site settings: ${total} migrated, ${failed} failed`)
}

// ---- Main ----
async function main() {
  const required = [SUPABASE_URL, SUPABASE_SERVICE_KEY, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL]
  if (required.some((v) => !v)) {
    console.error("Missing required env vars. Check SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, R2_* vars.")
    process.exit(1)
  }

  await migrateProducts()
  await migrateAboutImages()
  await migrateSiteSettings()

  console.log("\nMigration complete.")
}

main().catch((e) => {
  console.error("Fatal:", e)
  process.exit(1)
})
```

- [ ] **Add migration script to package.json**

Add to `scripts` section:
```json
"migrate:r2": "tsx --env-file=.env scripts/migrate-to-r2.ts"
```

- [ ] **Commit**

```bash
git add scripts/migrate-to-r2.ts package.json
git commit -m "feat: add R2 migration script for existing Supabase images"
```

---

## Task 12: Final verification

- [ ] **Build check**

```bash
pnpm run build
```

Expected: No new TypeScript errors related to R2 code. (Existing `ignoreBuildErrors: true` means this is advisory — still check the output.)

- [ ] **Verify `next.config.mjs` is correct**

File should have:
```javascript
images: {
  unoptimized: true,
},
```

No `remotePatterns` needed. Images serve directly from R2 CDN.

- [ ] **Final commit**

```bash
git add .
git commit -m "feat: complete R2 storage migration"
```

---

## How to run the migration (when ready)

1. Fill in all R2 env vars in `.env`
2. Get `SUPABASE_SERVICE_ROLE_KEY` from Supabase dashboard → Project Settings → API
3. Run: `pnpm migrate:r2`
4. Verify a few image URLs in DB now point to `r2.dev`
5. Deploy to Vercel (env vars must also be set in Vercel dashboard)
