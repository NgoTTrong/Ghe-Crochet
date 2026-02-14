import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Pencil, Plus, Users } from "lucide-react"
import { DeleteCategoryButton } from "@/components/admin/delete-category-button"

interface Category {
  id: string
  name: string
  description: string | null
  created_at: string
}

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: categories, error } = await supabase
    .from("categories")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching categories:", error)
    return <div>Error loading categories</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
            <Users className="w-6 h-6" />
            Quản lý danh mục
          </h1>
          <p className="text-gray-600">Quản lý các danh mục sản phẩm</p>
        </div>
        <Button asChild className="bg-pink-600 hover:bg-pink-700 text-white">
          <Link href="/admin/categories/new">
            <Plus className="h-4 w-4 mr-2" />
            Thêm danh mục
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {categories?.map((category: Category) => (
          <Card key={category.id} className="shadow-sm border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl text-gray-900">{category.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/categories/${category.id}/edit`}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <DeleteCategoryButton categoryId={category.id} categoryName={category.name} />
              </div>
            </CardHeader>
            <CardContent>
              {category.description && <p className="text-gray-600 mb-2">{category.description}</p>}
              <Badge variant="secondary">Tạo: {new Date(category.created_at).toLocaleDateString("vi-VN")}</Badge>
            </CardContent>
          </Card>
        ))}

        {categories?.length === 0 && (
          <Card className="shadow-sm border border-gray-200">
            <CardContent className="text-center py-8">
              <p className="text-gray-600">Chưa có danh mục nào</p>
              <Button asChild className="mt-4 bg-pink-600 hover:bg-pink-700 text-white">
                <Link href="/admin/categories/new">Tạo danh mục đầu tiên</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
