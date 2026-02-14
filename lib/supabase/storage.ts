import { createClient } from "./server"

export async function uploadProductImage(file: File, productId?: string): Promise<string> {
  const supabase = await createClient()

  // Generate unique filename
  const fileExt = file.name.split(".").pop()
  const fileName = `${productId || "temp"}-${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage.from("product-images").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(fileName)

  return publicUrl
}

export async function deleteProductImage(fileName: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.storage.from("product-images").remove([fileName])

  if (error) {
    throw new Error(`Delete failed: ${error.message}`)
  }
}

export function getImageFileName(url: string): string {
  return url.split("/").pop() || ""
}
