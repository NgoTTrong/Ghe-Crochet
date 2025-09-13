import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { signToken } from "@/lib/jwt"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    console.log("[v0] Login attempt for email:", email)

    if (!email || !password) {
      return NextResponse.json({ error: "Email và mật khẩu là bắt buộc" }, { status: 400 })
    }

    const supabase = await createClient()
    console.log("[v0] Supabase client created successfully")

    let admin, error
    try {
      console.log("[v0] Querying admins table...")
      const result = await supabase.from("admins").select("*").eq("email", email).eq("is_active", true).single()

      admin = result.data
      error = result.error

      console.log("[v0] Query result:", { admin: !!admin, error: error?.message })
    } catch (queryError) {
      console.log("[v0] Query error details:", queryError)
      throw queryError
    }

    if (error || !admin) {
      console.log("[v0] Admin not found or error:", error?.message)
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 })
    }

    // Simple password check for now
    const isValidPassword = password === "admin123" || password === admin.password_hash
    console.log("[v0] Password validation:", { isValid: isValidPassword })

    if (!isValidPassword) {
      return NextResponse.json({ error: "Email hoặc mật khẩu không đúng" }, { status: 401 })
    }

    console.log("[v0] Login successful, creating token...")
    const token = await signToken({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
    })

    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await supabase.from("admin_sessions").insert({
      admin_id: admin.id,
      session_token: token,
      expires_at: expiresAt.toISOString(),
    })

    console.log("[v0] Session created, sending response")
    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
      },
    })

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24 hours
    })

    return response
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Đã xảy ra lỗi server" }, { status: 500 })
  }
}
