"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Heart, LogIn } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Đã xảy ra lỗi")
      }

      console.log("[v0] Login successful, redirecting to admin...")

      // Wait a bit for cookie to be set properly
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Force a hard redirect instead of using router.push
      window.location.href = "/admin"
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Đã xảy ra lỗi")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="gradient-text">Ghẹ Crochet</span>
          </Link>
          <p className="text-muted-foreground mt-2">Đăng nhập vào trang quản trị</p>
        </div>

        <Card className="border-0 cute-shadow">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Đăng nhập</CardTitle>
            <CardDescription>Nhập thông tin đăng nhập của bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@ghecrochet.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-lg"
                  />
                </div>
                {error && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</p>}
                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Đang đăng nhập...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Đăng nhập
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                ← Quay về trang chủ
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Trang quản trị dành cho admin. Nếu bạn là khách hàng, vui lòng{" "}
            <Link
              href="/contact"
              className="text-slate-700 hover:text-primary hover:underline font-medium transition-colors"
            >
              liên hệ với chúng tôi
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
