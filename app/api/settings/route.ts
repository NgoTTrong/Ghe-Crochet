import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAuthenticatedAdmin } from "@/lib/admin-auth"

// PUT /api/settings — update the global "show discounts" flag
export async function PUT(request: NextRequest) {
  if (!(await isAuthenticatedAdmin(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  if (typeof body.show_discounts !== "boolean") {
    return NextResponse.json(
      { error: "show_discounts phải là boolean" },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from("site_settings").upsert({
    key: "show_discounts",
    value: body.show_discounts ? "true" : "false",
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error("Error updating show_discounts:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ show_discounts: body.show_discounts })
}
