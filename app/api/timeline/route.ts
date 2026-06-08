import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthenticatedAdmin } from "@/lib/admin-auth"

// GET /api/timeline — list ALL events (incl. hidden) for the admin manager
export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("timeline_events")
    .select("*")
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error listing timeline_events:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ events: data ?? [] })
}

// POST /api/timeline — create a new milestone
export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const title = (body.title ?? "").trim()

  if (!title) {
    return NextResponse.json({ error: "Tiêu đề là bắt buộc" }, { status: 400 })
  }

  const image_urls = Array.isArray(body.image_urls)
    ? body.image_urls.map((u: unknown) => String(u).trim()).filter(Boolean)
    : []

  const supabase = createAdminClient()

  // Place new milestone at the end of the list.
  const { data: last } = await supabase
    .from("timeline_events")
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = (last?.display_order ?? 0) + 1

  const { data, error } = await supabase
    .from("timeline_events")
    .insert([
      {
        title,
        description: body.description?.trim() || null,
        event_date: body.event_date?.trim() || null,
        image_urls,
        is_active: body.is_active ?? true,
        display_order: nextOrder,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error("Error creating timeline_event:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ event: data }, { status: 201 })
}
