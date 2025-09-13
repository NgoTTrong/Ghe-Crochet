import { createClient } from "@/lib/supabase/server"
import { ProductForm } from "@/components/admin/product-form"

export default async function NewProductPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase.from("categories").select("*").order("name")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Thêm sản phẩm mới</h1>
        <p className="text-muted-foreground">Tạo sản phẩm mới cho cửa hàng</p>
      </div>

      <ProductForm categories={categories || []} />
    </div>
  )
}
