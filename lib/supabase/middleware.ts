import { NextResponse, type NextRequest } from "next/server"
import { verifyToken } from "@/lib/jwt"

export async function updateSession(request: NextRequest) {
  const token = request.cookies.get("admin_token")?.value

  console.log("[v0] Middleware - Path:", request.nextUrl.pathname)
  console.log("[v0] Middleware - Has token:", !!token)

  // Only protect admin routes - public pages should be accessible
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!token) {
      // no token, redirect to login for admin pages
      console.log("[v0] Middleware - No token, redirecting to login")
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    try {
      const decoded = await verifyToken(token)
      console.log("[v0] Middleware - Token valid for admin:", decoded)
    } catch (error) {
      // invalid token, redirect to login
      console.log("[v0] Middleware - Invalid token, redirecting to login:", error)
      const url = request.nextUrl.clone()
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}
