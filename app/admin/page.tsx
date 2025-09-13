import { createClient } from "@/lib/supabase/server"
import { AdminStats } from "@/components/admin/admin-stats"
import { RecentProducts } from "@/components/admin/recent-products"
import { QuickActions } from "@/components/admin/quick-actions"

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: products } = await supabase.from("products").select("*").order("created_at", { ascending: false })

  const { data: categories } = await supabase.from("categories").select("*")

  const stats = {
    totalProducts: products?.length || 0,
    featuredProducts: products?.filter((p) => p.is_featured).length || 0,
    availableProducts: products?.filter((p) => p.is_available).length || 0,
    totalCategories: categories?.length || 0,
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Chào mừng trở lại!</h1>
        <p className="text-gray-600">Quản lý cửa hàng Ghẹ Crochet của bạn</p>
      </div>

      {/* Stats */}
      <AdminStats stats={stats} />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <QuickActions />
        </div>

        {/* Recent Products */}
        <div className="lg:col-span-2">
          <RecentProducts products={products?.slice(0, 5) || []} />
        </div>
      </div>
    </div>
  )
}
