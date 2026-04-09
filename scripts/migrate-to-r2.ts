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
