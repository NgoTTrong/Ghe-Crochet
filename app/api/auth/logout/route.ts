import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value

    if (token) {
      const supabase = await createClient()

      await supabase.from("admin_sessions").delete().eq("session_token", token)
    }

    const response = NextResponse.json({ success: true })
    response.cookies.delete("admin_token")

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Đã xảy ra lỗi server" }, { status: 500 })
  }
}
