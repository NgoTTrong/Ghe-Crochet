import { CategoryForm } from "@/components/admin/category-form"

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Thêm danh mục mới</h1>
        <p className="text-muted-foreground">Tạo danh mục sản phẩm mới</p>
      </div>

      <CategoryForm />
    </div>
  )
}
