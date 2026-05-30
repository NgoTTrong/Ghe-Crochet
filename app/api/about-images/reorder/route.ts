import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthenticatedAdmin } from "@/lib/admin-auth"

// POST /api/about-images/reorder — persist a new drag-and-drop order
// Body: { orderedIds: number[] } in the desired display order.
export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const orderedIds = body.orderedIds

  if (!Array.isArray(orderedIds) || orderedIds.some((id) => !Number.isFinite(Number(id)))) {
    return NextResponse.json({ error: "orderedIds must be an array of ids" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // display_order starts at 1 to match the position shown in the UI.
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("about_images").update({ display_order: index + 1 }).eq("id", Number(id))
    )
  )

  const failed = results.find((r) => r.error)
  if (failed?.error) {
    console.error("Error reordering about_images:", failed.error)
    return NextResponse.json({ error: failed.error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
