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
