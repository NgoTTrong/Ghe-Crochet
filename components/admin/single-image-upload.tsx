"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { Upload, X } from "lucide-react"
import Image from "next/image"

interface SingleImageUploadProps {
  value?: string
  onChange: (url: string | undefined) => void
  disabled?: boolean
  placeholder?: string
}

export function SingleImageUpload({ value, onChange, disabled, placeholder = "Tải ảnh lên" }: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const supabase = createClient()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || acceptedFiles.length === 0) return

      const file = acceptedFiles[0]
      setUploading(true)
      setUploadProgress(0)

      try {
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

        setUploadProgress(100)
        onChange(publicUrl)
      } catch (error) {
        console.error("Upload error:", error)
        alert("Có lỗi xảy ra khi tải ảnh lên")
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    },
    [onChange, disabled, supabase],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    disabled: disabled || uploading,
  })

  const removeImage = async () => {
    if (disabled || !value) return

    try {
      // Extract filename from URL
      const fileName = value.split("/").pop()
      if (fileName) {
        await supabase.storage.from("product-images").remove([fileName])
      }

      onChange(undefined)
    } catch (error) {
      console.error("Delete error:", error)
      alert("Có lỗi xảy ra khi xóa ảnh")
    }
  }

  if (value && !uploading) {
    return (
      <Card className="relative group">
        <CardContent className="p-4">
          <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
            <Image src={value || "/placeholder.svg"} alt="Uploaded image" fill className="object-cover" />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={removeImage}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
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
                  <p className="font-medium">{placeholder}</p>
                  <p className="text-muted-foreground">Hỗ trợ: JPG, PNG, WebP</p>
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
  )
}
