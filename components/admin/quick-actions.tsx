import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Package, Grid3X3, Settings } from "lucide-react"

export function QuickActions() {
  const actions = [
    {
      title: "Thêm sản phẩm",
      description: "Tạo sản phẩm mới",
      href: "/admin/products/new",
      icon: Plus,
      color: "bg-primary hover:bg-primary/90 text-primary-foreground",
    },
    {
      title: "Quản lý sản phẩm",
      description: "Xem và chỉnh sửa",
      href: "/admin/products",
      icon: Package,
      color: "bg-secondary hover:bg-secondary/90 text-secondary-foreground",
    },
    {
      title: "Quản lý danh mục",
      description: "Thêm/sửa danh mục",
      href: "/admin/categories",
      icon: Grid3X3,
      color: "bg-accent hover:bg-accent/90 text-accent-foreground",
    },
    {
      title: "Cài đặt",
      description: "Cấu hình hệ thống",
      href: "/admin/settings",
      icon: Settings,
      color: "bg-muted hover:bg-muted/90 text-muted-foreground",
    },
  ]

  return (
    <Card className="border-0 cute-shadow">
      <CardHeader>
        <CardTitle>Thao tác nhanh</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Button key={action.title} asChild className={`w-full justify-start h-auto p-4 ${action.color}`}>
              <Link href={action.href}>
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs opacity-80">{action.description}</div>
                  </div>
                </div>
              </Link>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}
