"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { ImageUpload } from "./image-upload"
import { createClient } from "@/lib/supabase/client"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  materials: string | null
  size_info: string | null
  care_instructions: string | null
  is_featured: boolean
  is_available: boolean
  images: string[]
}

interface ProductFormProps {
  categories: Category[]
  product?: Product
}

export function ProductForm({ categories, product }: ProductFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    category: product?.category || "",
    materials: product?.materials || "",
    size_info: product?.size_info || "",
    care_instructions: product?.care_instructions || "",
    is_featured: product?.is_featured || false,
    is_available: product?.is_available ?? true,
    images: product?.images || [],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      console.log("[v0] Starting product save, product ID:", product?.id)
      console.log("[v0] Form data:", formData)

      const productData = {
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        category: formData.category,
        materials: formData.materials || null,
        size_info: formData.size_info || null,
        care_instructions: formData.care_instructions || null,
        is_featured: formData.is_featured,
        is_available: formData.is_available,
        images: formData.images,
      }

      console.log("[v0] Product data to save:", productData)

      if (product) {
        // Update existing product
        console.log("[v0] Updating product with ID:", product.id)
        const { data, error } = await supabase.from("products").update(productData).eq("id", product.id).select()

        console.log("[v0] Update result:", { data, error })
        if (error) throw error
      } else {
        // Create new product
        console.log("[v0] Creating new product")
        const { data, error } = await supabase.from("products").insert(productData).select()

        console.log("[v0] Insert result:", { data, error })
        if (error) throw error
      }

      console.log("[v0] Product saved successfully, redirecting...")
      router.push("/admin/products")
      router.refresh()
    } catch (error) {
      console.error("[v0] Error saving product:", error)
      alert("Có lỗi xảy ra khi lưu sản phẩm: " + (error as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" asChild>
        <Link href="/admin/products">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Link>
      </Button>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên sản phẩm *</Label>
              <Input
                id="name"
                type="text"
                placeholder="Nhập tên sản phẩm"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Danh mục *</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Giá (VND) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="0"
                value={formData.price}
                onChange={(e) => handleChange("price", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="materials">Chất liệu</Label>
              <Input
                id="materials"
                type="text"
                placeholder="Ví dụ: Cotton yarn, polyester filling"
                value={formData.materials}
                onChange={(e) => handleChange("materials", e.target.value)}
              />
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="size_info">Kích thước</Label>
              <Input
                id="size_info"
                type="text"
                placeholder="Ví dụ: 25cm x 20cm x 15cm"
                value={formData.size_info}
                onChange={(e) => handleChange("size_info", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="care_instructions">Hướng dẫn bảo quản</Label>
              <Textarea
                id="care_instructions"
                placeholder="Ví dụ: Hand wash with mild soap, air dry only"
                value={formData.care_instructions}
                onChange={(e) => handleChange("care_instructions", e.target.value)}
                rows={3}
              />
            </div>

            {/* Settings */}
            <Card className="border-0 bg-muted/30">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="is_featured">Sản phẩm nổi bật</Label>
                    <p className="text-xs text-muted-foreground">Hiển thị trong danh sách nổi bật</p>
                  </div>
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => handleChange("is_featured", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="is_available">Còn hàng</Label>
                    <p className="text-xs text-muted-foreground">Khách hàng có thể đặt hàng</p>
                  </div>
                  <Switch
                    id="is_available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => handleChange("is_available", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Mô tả sản phẩm *</Label>
          <Textarea
            id="description"
            placeholder="Mô tả chi tiết về sản phẩm, đặc điểm nổi bật..."
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            required
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label>Hình ảnh sản phẩm</Label>
          <ImageUpload
            value={formData.images}
            onChange={(urls) => handleChange("images", urls)}
            maxFiles={5}
            disabled={isSubmitting}
          />
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {product ? "Cập nhật sản phẩm" : "Lưu sản phẩm"}
              </>
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/products">Hủy</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
