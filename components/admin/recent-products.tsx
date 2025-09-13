import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { Eye, Edit } from "lucide-react"

interface Product {
  id: string
  name: string
  category: string
  price: number
  is_featured: boolean
  is_available: boolean
  images: string[]
  created_at: string
}

interface RecentProductsProps {
  products: Product[]
}

export function RecentProducts({ products }: RecentProductsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  return (
    <Card className="border-0 cute-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Sản phẩm gần đây</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/products">Xem tất cả</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {products.length > 0 ? (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <Image
                    src={product.images[0] || "/placeholder.svg?height=64&width=64"}
                    alt={product.name}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="font-medium truncate">{product.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {product.category}
                        </Badge>
                        {product.is_featured && (
                          <Badge className="bg-accent text-accent-foreground text-xs">Nổi bật</Badge>
                        )}
                        {!product.is_available && (
                          <Badge variant="destructive" className="text-xs">
                            Hết hàng
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-primary">{formatPrice(product.price)}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/products/${product.id}`}>
                      <Eye className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/products/${product.id}/edit`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Chưa có sản phẩm nào</p>
            <Button asChild className="mt-4">
              <Link href="/admin/products/new">Thêm sản phẩm đầu tiên</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
