import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyToken } from "@/lib/jwt"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Không có token xác thực" }, { status: 401 })
    }

    const decoded = (await verifyToken(token)) as any

    const supabase = await createClient()

    const { data: session, error: sessionError } = await supabase
      .from("admin_sessions")
      .select("*")
      .eq("session_token", token)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session không hợp lệ hoặc đã hết hạn" }, { status: 401 })
    }

    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("id, email, full_name, role, is_active")
      .eq("id", decoded.adminId)
      .eq("is_active", true)
      .single()

    if (adminError || !admin) {
      return NextResponse.json({ error: "Admin không tồn tại" }, { status: 401 })
    }

    return NextResponse.json({
      admin: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
      },
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ error: "Token không hợp lệ" }, { status: 401 })
  }
}
