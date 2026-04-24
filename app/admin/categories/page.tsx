import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Plus, Users } from "lucide-react"
import { SortableCategoriesList } from "@/components/admin/sortable-categories-list"

interface Category {
  id: string
  name: string
  description: string | null
  icon: string | null
  display_order: number
  created_at: string
}

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching categories:", error)
    return <div>Error loading categories</div>
  }

  const list: Category[] = categories ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <Users className="w-6 h-6" />
            Quản lý danh mục
          </h1>
          <p className="text-gray-600">
            Quản lý các danh mục sản phẩm. Kéo thả để sắp xếp thứ tự hiển thị.
          </p>
        </div>
        <Button asChild className="bg-black hover:bg-gray-800 text-white">
          <Link href="/admin/categories/new">
            <Plus className="h-4 w-4 mr-2" />
            Thêm danh mục
          </Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <Card className="shadow-sm border border-gray-200">
          <CardContent className="text-center py-8">
            <p className="text-gray-600">Chưa có danh mục nào</p>
            <Button asChild className="mt-4 bg-black hover:bg-gray-800 text-white">
              <Link href="/admin/categories/new">Tạo danh mục đầu tiên</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <SortableCategoriesList initialCategories={list} />
      )}
    </div>
  )
}
