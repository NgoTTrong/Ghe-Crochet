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

    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 413 })
    }

    const validExtensions = ["jpg", "jpeg", "png", "webp"]
    const validMimeTypes = ["image/jpeg", "image/png", "image/webp"]
    const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
    if (!validExtensions.includes(ext)) {
      return NextResponse.json({ error: "Invalid file type. Only JPG, PNG, WebP allowed." }, { status: 400 })
    }
    const contentType = validMimeTypes.includes(file.type) ? file.type : "image/webp"

    const validFolders = ["product-images", "about-images", "site"]
    if (!folder || !validFolders.includes(folder)) {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`

    const url = await uploadToR2(buffer, key, contentType)
    return NextResponse.json({ url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
