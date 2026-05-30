import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthenticatedAdmin } from "@/lib/admin-auth"

// GET /api/about-images — list ALL images (incl. hidden) for the admin manager
export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("about_images")
    .select("*")
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error listing about_images:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ images: data ?? [] })
}

// POST /api/about-images — create a new memory
export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const title = (body.title ?? "").trim()
  const image_url = (body.image_url ?? "").trim()

  if (!title) {
    return NextResponse.json({ error: "Tiêu đề là bắt buộc" }, { status: 400 })
  }
  if (!image_url) {
    return NextResponse.json({ error: "Hình ảnh là bắt buộc" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Place new memory at the end of the list.
  const { data: last } = await supabase
    .from("about_images")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = (last?.display_order ?? 0) + 1

  const { data, error } = await supabase
    .from("about_images")
    .insert([
      {
        title,
        description: body.description?.trim() || null,
        image_url,
        is_active: body.is_active ?? true,
        display_order: nextOrder,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error creating about_image:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ image: data }, { status: 201 })
}
