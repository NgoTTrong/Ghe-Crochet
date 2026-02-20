"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

const PRESET_ICONS = [
  "🧶", "🪡", "🧵", "✂️", "🎀",
  "🐱", "🐶", "🐻", "🦊", "🐰",
  "🦄", "🐸", "🦋", "🌸", "🌺",
  "🎁", "🏠", "👗", "👒", "🌈",
  "⭐", "💖", "✨", "🎨", "🍀",
]

interface Category {
  id: string
  name: string
  description: string | null
  icon: string | null
}

interface CategoryFormProps {
  category?: Category
}

export function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    icon: category?.icon || "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (category) {
        const { error } = await supabase
          .from("categories")
          .update({
            name: formData.name,
            description: formData.description || null,
            icon: formData.icon || null,
          })
          .eq("id", category.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("categories").insert({
          name: formData.name,
          description: formData.description || null,
          icon: formData.icon || null,
        })

        if (error) throw error
      }

      router.push("/admin/categories")
      router.refresh()
    } catch (error) {
      console.error("Error saving category:", error)
      alert("Có lỗi xảy ra khi lưu danh mục")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Button variant="outline" asChild>
        <Link href="/admin/categories">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{category ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Tên danh mục *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nhập tên danh mục"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Nhập mô tả danh mục (tùy chọn)"
                rows={3}
              />
            </div>

            {/* Icon Picker */}
            <div className="space-y-3">
              <Label>Icon danh mục</Label>

              {/* Preview */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-2xl bg-muted/30">
                  {formData.icon || "?"}
                </div>
                <div className="flex-1">
                  <Input
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="Nhập emoji hoặc chọn bên dưới"
                    className="text-lg"
                    maxLength={4}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Gõ emoji trực tiếp hoặc chọn từ danh sách
                  </p>
                </div>
              </div>

              {/* Preset Grid */}
              <div className="grid grid-cols-10 gap-1.5">
                {PRESET_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: emoji })}
                    className={`
                      w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all
                      hover:bg-primary/20 hover:scale-110
                      ${formData.icon === emoji
                        ? "bg-primary/30 ring-2 ring-primary scale-110"
                        : "bg-muted/50"
                      }
                    `}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {formData.icon && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, icon: "" })}
                  className="text-xs text-muted-foreground hover:text-destructive underline"
                >
                  Xóa icon
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Đang lưu..." : "Lưu danh mục"}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/categories">Hủy</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
