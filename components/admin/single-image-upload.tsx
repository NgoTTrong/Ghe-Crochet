"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, X } from "lucide-react"
import Image from "next/image"
import imageCompression from "browser-image-compression"

const compressionOptions = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
  fileType: "image/webp" as const,
}

interface SingleImageUploadProps {
  value?: string
  onChange: (url: string | undefined) => void
  disabled?: boolean
  placeholder?: string
}

export function SingleImageUpload({ value, onChange, disabled, placeholder = "Tải ảnh lên" }: SingleImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || acceptedFiles.length === 0) return

      const file = acceptedFiles[0]
      setUploading(true)
      setUploadProgress(0)

      try {
        const compressed = await imageCompression(file, compressionOptions)

        const formData = new FormData()
        formData.append("file", compressed, `image-${Date.now()}.webp`)
        formData.append("folder", "product-images")

        setUploadProgress(50)
        const res = await fetch("/api/upload", { method: "POST", body: formData })
        if (!res.ok) throw new Error("Upload failed")
        const { url } = await res.json()

        setUploadProgress(100)
        onChange(url)
      } catch (error) {
        console.error("Upload error:", error)
        alert("Có lỗi xảy ra khi tải ảnh lên")
      } finally {
        setUploading(false)
        setUploadProgress(0)
      }
    },
    [onChange, disabled],
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
      const res = await fetch("/api/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: value }),
      })
      if (!res.ok) throw new Error("Delete failed")
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
