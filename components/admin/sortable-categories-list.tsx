"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GripVertical, Pencil } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { DeleteCategoryButton } from "@/components/admin/delete-category-button"

interface Category {
  id: string
  name: string
  description: string | null
  icon: string | null
  display_order: number
  created_at: string
}

function SortableCard({ category }: { category: Category }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-gray-400 hover:text-gray-700 touch-none"
              aria-label="Kéo để sắp xếp"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5" />
            </button>
            <CardTitle className="text-xl text-gray-900 flex items-center gap-2 truncate">
              {category.icon && <span className="text-2xl">{category.icon}</span>}
              {category.name}
            </CardTitle>
          </div>
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
          <Badge variant="secondary">
            Tạo: {new Date(category.created_at).toLocaleDateString("vi-VN")}
          </Badge>
        </CardContent>
      </Card>
    </div>
  )
}

export function SortableCategoriesList({
  initialCategories,
}: {
  initialCategories: Category[]
}) {
  const router = useRouter()
  const [items, setItems] = useState(initialCategories)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const persistOrder = async (next: Category[]) => {
    setSaving(true)
    try {
      const updates = next.map((c, i) =>
        supabase
          .from("categories")
          .update({ display_order: (i + 1) * 10 })
          .eq("id", c.id)
      )
      const results = await Promise.all(updates)
      const firstError = results.find((r) => r.error)?.error
      if (firstError) throw firstError
      router.refresh()
    } catch (err) {
      console.error("Error saving category order:", err)
      alert("Có lỗi xảy ra khi lưu thứ tự danh mục")
      setItems(initialCategories)
    } finally {
      setSaving(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((c) => c.id === active.id)
    const newIndex = items.findIndex((c) => c.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const next = arrayMove(items, oldIndex, newIndex)
    setItems(next)
    persistOrder(next)
  }

  if (items.length === 0) return null

  return (
    <div className="relative">
      {saving && (
        <div className="absolute top-0 right-0 text-xs text-gray-500 -mt-6">
          Đang lưu thứ tự...
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="grid gap-4">
            {items.map((category) => (
              <SortableCard key={category.id} category={category} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
