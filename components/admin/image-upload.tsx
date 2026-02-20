"use client"

import type React from "react"
import { useState, useCallback, useRef } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { Upload, X, ImageIcon, Star, RefreshCw } from "lucide-react"
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
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled) return

      setUploading(true)
      setUploadProgress(0)

      try {
        const uploadPromises = acceptedFiles.map(async (file, index) => {
          const fileExt = file.name.split(".").pop()
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

          const { data, error } = await supabase.storage.from("product-images").upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          })

          if (error) throw error

          const {
            data: { publicUrl },
          } = supabase.storage.from("product-images").getPublicUrl(fileName)

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
      const fileName = urlToRemove.split("/").pop()
      if (fileName) {
        await supabase.storage.from("product-images").remove([fileName])
      }
      onChange(value.filter((url) => url !== urlToRemove))
    } catch (error) {
      console.error("Delete error:", error)
      alert("Có lỗi xảy ra khi xóa ảnh")
    }
  }

  const setMainImage = (url: string) => {
    if (disabled || value[0] === url) return
    onChange([url, ...value.filter((u) => u !== url)])
  }

  const handleReplaceClick = (index: number) => {
    if (disabled) return
    setReplacingIndex(index)
    fileInputRef.current?.click()
  }

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || replacingIndex === null) return

    setUploading(true)
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

      const { error } = await supabase.storage.from("product-images").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(fileName)

      // Delete old image from storage
      const oldFileName = value[replacingIndex].split("/").pop()
      if (oldFileName) {
        await supabase.storage.from("product-images").remove([oldFileName])
      }

      const newUrls = [...value]
      newUrls[replacingIndex] = publicUrl
      onChange(newUrls)
    } catch (error) {
      console.error("Replace error:", error)
      alert("Có lỗi xảy ra khi thay thế ảnh")
    } finally {
      setUploading(false)
      setReplacingIndex(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      {/* Hidden file input for replacing a specific image */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleReplaceFile}
      />

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

            {uploading && replacingIndex === null && (
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

      {/* Replacing indicator (shown when image grid is full) */}
      {uploading && replacingIndex !== null && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Đang thay thế ảnh...
        </div>
      )}

      {/* Image Preview Grid */}
      {value.length > 0 && (
        <>
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

                    {/* Hover overlay with actions */}
                    {!disabled && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        {index !== 0 && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            title="Đặt làm ảnh chính"
                            className="h-8 w-8 p-0"
                            onClick={() => setMainImage(url)}
                          >
                            <Star className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          title="Thay thế ảnh"
                          className="h-8 w-8 p-0"
                          onClick={() => handleReplaceClick(index)}
                          disabled={uploading}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          title="Xóa ảnh"
                          className="h-8 w-8 p-0"
                          onClick={() => removeImage(url)}
                          disabled={uploading}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Main image badge */}
                  {index === 0 ? (
                    <div className="mt-1.5 flex justify-center">
                      <div className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="h-2.5 w-2.5 fill-current" />
                        Ảnh chính
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1.5 flex justify-center">
                      <div className="text-xs text-muted-foreground">Ảnh {index + 1}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {!disabled && (
            <p className="text-xs text-muted-foreground">
              Di chuột vào ảnh để thay thế, xóa hoặc đặt làm ảnh chính
            </p>
          )}
        </>
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
