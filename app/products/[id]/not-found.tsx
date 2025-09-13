import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Header />

      <main className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto text-center">
            <Card className="border-0 cute-shadow">
              <CardContent className="p-8 space-y-6">
                <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">Không tìm thấy sản phẩm</h1>
                  <p className="text-muted-foreground">Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                    <Link href="/products">
                      <Search className="w-4 h-4 mr-2" />
                      Xem tất cả sản phẩm
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-full bg-transparent">
                    <Link href="/">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Về trang chủ
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
