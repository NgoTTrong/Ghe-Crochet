import { type NextRequest } from "next/server"
import { verifyToken } from "@/lib/jwt"

/**
 * Verifies the admin JWT from the request cookie.
 * Returns true when the caller is an authenticated admin, false otherwise.
 */
export async function isAuthenticatedAdmin(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("admin_token")?.value
  if (!token) return false
  try {
    await verifyToken(token)
    return true
  } catch {
    return false
  }
}
