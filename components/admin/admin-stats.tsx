import { Card, CardContent } from "@/components/ui/card"
import { Package, Star, Eye, Grid3X3 } from "lucide-react"

interface AdminStatsProps {
  stats: {
    totalProducts: number
    featuredProducts: number
    availableProducts: number
    totalCategories: number
  }
}

export function AdminStats({ stats }: AdminStatsProps) {
  const statItems = [
    {
      title: "Tổng sản phẩm",
      value: stats.totalProducts,
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Sản phẩm nổi bật",
      value: stats.featuredProducts,
      icon: Star,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Đang bán",
      value: stats.availableProducts,
      icon: Eye,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Danh mục",
      value: stats.totalCategories,
      icon: Grid3X3,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item) => {
        const Icon = item.icon
        return (
          <Card key={item.title} className="border-0 cute-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{item.title}</p>
                  <p className="text-2xl font-bold">{item.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-full ${item.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
