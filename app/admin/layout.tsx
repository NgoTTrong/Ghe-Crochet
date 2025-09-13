import type React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/jwt"
import { AdminHeader } from "@/components/admin/admin-header"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = cookies()
  const token = cookieStore.get("admin_token")?.value

  if (!token) {
    redirect("/auth/login")
  }

  try {
    await verifyToken(token)
  } catch (error) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AdminHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  )
}
