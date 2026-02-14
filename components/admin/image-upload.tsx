"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { Upload, X, ImageIcon } from "lucide-react"
import Image from "next/image"

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxFiles?: number
  disabled?: boolean
}

export function ImageUpload({ value = [], onChange, maxFiles = 5, disabled }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const supabase = createClient()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled) return

      setUploading(true)
      setUploadProgress(0)

      try {
        const uploadPromises = acceptedFiles.map(async (file, index) => {
          // Generate unique filename
          const fileExt = file.name.split(".").pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

          const { data, error } = await supabase.storage.from("product-images").upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          })

          if (error) throw error

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from("product-images").getPublicUrl(fileName)

          // Update progress
          setUploadProgress(((index + 1) / acceptedFiles.length) * 100)

          return publicUrl
        })

        const uploadedUrls = await Promise.all(uploadPromises)
        const newUrls = [...value, ...uploadedUrls].slice(0, maxFiles)
        onChange(newUrls)
      } catch (error) {
        console.error("Upload error:", error)
        alert("Có lỗi xảy ra khi tải ảnh lên")
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    },
    [value, onChange, maxFiles, disabled, supabase],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: maxFiles - value.length,
    disabled: disabled || uploading,
  })

  const removeImage = async (urlToRemove: string) => {
    if (disabled) return

    try {
      // Extract filename from URL
      const fileName = urlToRemove.split("/").pop()
      if (fileName) {
        await supabase.storage.from("product-images").remove([fileName])
      }

      const newUrls = value.filter((url) => url !== urlToRemove)
      onChange(newUrls)
    } catch (error) {
      console.error("Delete error:", error)
      alert("Có lỗi xảy ra khi xóa ảnh")
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {value.length < maxFiles && (
        <Card>
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
                ${disabled || uploading ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5"}
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-sm">
                  {isDragActive ? (
                    <p>Thả ảnh vào đây...</p>
                  ) : (
                    <div>
                      <p className="font-medium">Kéo thả ảnh hoặc click để chọn</p>
                      <p className="text-muted-foreground">
                        Hỗ trợ: JPG, PNG, WebP (tối đa {maxFiles - value.length} ảnh)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {uploading && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Đang tải lên...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Image Preview Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <Card key={url} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square relative rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={url || "/placeholder.svg"}
                    alt={`Product image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  {!disabled && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(url)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {index === 0 && (
                  <div className="absolute bottom-2 left-2">
                    <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">Ảnh chính</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {value.length === 0 && !uploading && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có ảnh nào được tải lên</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
