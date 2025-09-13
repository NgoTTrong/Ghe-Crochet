"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { createClient } from "@/lib/supabase/client"
import { Trash2 } from "lucide-react"

interface DeleteProductButtonProps {
  productId: string
  productName: string
}

export function DeleteProductButton({ productId, productName }: DeleteProductButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)

    try {
      console.log("[v0] Starting product delete, ID:", productId)

      // First get the product to check for images
      const { data: product, error: fetchError } = await supabase
        .from("products")
        .select("images")
        .eq("id", productId)
        .single()

      console.log("[v0] Fetched product for delete:", { product, fetchError })
      if (fetchError) throw fetchError

      // Delete product images from storage if they exist
      if (product?.images && product.images.length > 0) {
        console.log("[v0] Deleting product images:", product.images)
        const imageFileNames = product.images
          .map((url: string) => {
            return url.split("/").pop() || ""
          })
          .filter(Boolean)

        if (imageFileNames.length > 0) {
          const { error: storageError } = await supabase.storage.from("product-images").remove(imageFileNames)
          console.log("[v0] Storage delete result:", storageError)
        }
      }

      // Delete the product
      console.log("[v0] Deleting product from database")
      const { data, error } = await supabase.from("products").delete().eq("id", productId).select()

      console.log("[v0] Delete result:", { data, error })
      if (error) throw error

      console.log("[v0] Product deleted successfully")
      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting product:", error)
      alert("Có lỗi xảy ra khi xóa sản phẩm: " + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa sản phẩm</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn xóa sản phẩm "{productName}"? Hành động này sẽ xóa cả hình ảnh và không thể hoàn tác.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={loading}>
            {loading ? "Đang xóa..." : "Xóa"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
