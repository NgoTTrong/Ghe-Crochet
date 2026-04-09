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
