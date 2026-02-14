import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle, ArrowLeft } from "lucide-react"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "Configuration":
        return "Có lỗi cấu hình hệ thống. Vui lòng liên hệ quản trị viên."
      case "AccessDenied":
        return "Truy cập bị từ chối. Bạn không có quyền truy cập vào tài nguyên này."
      case "Verification":
        return "Không thể xác minh email. Vui lòng kiểm tra lại liên kết xác minh."
      default:
        return "Đã xảy ra lỗi không xác định trong quá trình đăng nhập."
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-6">
      <div className="w-full max-w-md">
        <Card className="border-0 cute-shadow">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Lỗi đăng nhập</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground">{getErrorMessage(params?.error || "")}</p>
              {params?.error && (
                <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted p-2 rounded">
                  Mã lỗi: {params.error}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                <Link href="/auth/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Thử lại đăng nhập
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-full bg-transparent">
                <Link href="/">Về trang chủ</Link>
              </Button>
            </div>

            <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground">
                Nếu vấn đề vẫn tiếp tục, vui lòng{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  liên hệ hỗ trợ
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
