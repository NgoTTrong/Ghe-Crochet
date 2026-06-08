import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthenticatedAdmin } from "@/lib/admin-auth"
import { deleteFromR2, getKeyFromUrl } from "@/lib/r2/storage"

// PATCH /api/timeline/[id] — update a milestone
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const id = Number(params.id)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const body = await request.json()
  const updates: Record<string, unknown> = {}

  if (body.title !== undefined) {
    const title = String(body.title).trim()
    if (!title) return NextResponse.json({ error: "Tiêu đề là bắt buộc" }, { status: 400 })
    updates.title = title
  }
  if (body.description !== undefined) updates.description = String(body.description).trim() || null
  if (body.event_date !== undefined) updates.event_date = String(body.event_date).trim() || null
  if (body.image_urls !== undefined) {
    updates.image_urls = Array.isArray(body.image_urls)
      ? body.image_urls.map((u: unknown) => String(u).trim()).filter(Boolean)
      : []
  }
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active)

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("timeline_events")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating timeline_event:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ event: data })
}

// DELETE /api/timeline/[id] — remove a milestone and its R2 image
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const id = Number(params.id)
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Grab the image URLs first so we can clean up the R2 objects after the row is gone.
  const { data: existing } = await supabase
    .from("timeline_events")
    .select("image_urls")
    .eq("id", id)
    .maybeSingle()

  const { error } = await supabase.from("timeline_events").delete().eq("id", id)
  if (error) {
    console.error("Error deleting timeline_event:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Best-effort R2 cleanup — only for objects we host (skip external URLs).
  const publicBase = process.env.R2_PUBLIC_URL ?? " "
  const urls: string[] = existing?.image_urls ?? []
  await Promise.all(
    urls
      .filter((url) => url.includes(publicBase))
      .map(async (url) => {
        try {
          await deleteFromR2(getKeyFromUrl(url))
        } catch (e) {
          console.warn("Failed to delete R2 object for timeline_event:", id, url, e)
        }
      })
  )

  return NextResponse.json({ success: true })
}
