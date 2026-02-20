'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, ImageIcon, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

const IMAGE_SLOTS = [
  {
    key: 'home_hero_image',
    label: 'Ảnh Hero trang chủ',
    description: 'Hiển thị ở phần hero chính (bên phải tiêu đề lớn)',
    aspect: 'aspect-square'
  },
  {
    key: 'home_custom_order_image',
    label: 'Ảnh "Đặt hàng riêng"',
    description: 'Hiển thị trong section "Muốn một sản phẩm chỉ dành cho bạn?"',
    aspect: 'aspect-square'
  }
] as const

interface HomeImagesManagerProps {
  initialSettings: Record<string, string>
}

export function HomeImagesManager({ initialSettings }: HomeImagesManagerProps) {
  const [settings, setSettings] =
    useState<Record<string, string>>(initialSettings)
  const [uploading, setUploading] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const supabase = createClient()

  const uploadImage = async (key: string, file: File) => {
    setUploading(key)
    setSaved(null)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `site/${key}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true, cacheControl: '3600' })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl }
      } = supabase.storage.from('product-images').getPublicUrl(fileName)

      const { error: dbError } = await supabase
        .from('site_settings')
        .upsert({ key, value: publicUrl, updated_at: new Date().toISOString() })

      if (dbError) throw dbError

      setSettings((prev) => ({ ...prev, [key]: publicUrl }))
      setSaved(key)
      setTimeout(() => setSaved(null), 2500)
    } catch (err) {
      console.error('Upload error:', err)
      alert('Có lỗi khi tải ảnh lên')
    } finally {
      setUploading(null)
    }
  }

  const removeImage = async (key: string) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key, value: null, updated_at: new Date().toISOString() })

      if (error) throw error

      setSettings((prev) => ({ ...prev, [key]: '' }))
    } catch (err) {
      console.error('Remove error:', err)
      alert('Có lỗi khi xóa ảnh')
    }
  }

  return (
    <div className='grid md:grid-cols-2 gap-6'>
      {IMAGE_SLOTS.map((slot) => (
        <ImageSlotCard
          key={slot.key}
          label={slot.label}
          description={slot.description}
          aspect={slot.aspect}
          currentUrl={settings[slot.key] || ''}
          uploading={uploading === slot.key}
          saved={saved === slot.key}
          onUpload={(file) => uploadImage(slot.key, file)}
          onRemove={() => removeImage(slot.key)}
        />
      ))}
    </div>
  )
}

interface ImageSlotCardProps {
  label: string
  description: string
  aspect: string
  currentUrl: string
  uploading: boolean
  saved: boolean
  onUpload: (file: File) => void
  onRemove: () => void
}

function ImageSlotCard({
  label,
  description,
  aspect,
  currentUrl,
  uploading,
  saved,
  onUpload,
  onRemove
}: ImageSlotCardProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles[0]) onUpload(acceptedFiles[0])
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1,
    disabled: uploading
  })

  return (
    <Card className='shadow-sm border border-gray-200'>
      <CardHeader>
        <CardTitle className='text-base flex items-center gap-2'>
          {label}
          {saved && (
            <span className='flex items-center gap-1 text-green-600 text-sm font-normal'>
              <CheckCircle2 className='w-3.5 h-3.5' />
              Đã lưu
            </span>
          )}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Current image preview */}
        <div
          className={`${aspect} relative rounded-xl overflow-hidden bg-muted`}
        >
          {currentUrl ? (
            <>
              <Image
                src={currentUrl}
                alt={label}
                fill
                className='object-cover'
              />
              <button
                type='button'
                onClick={onRemove}
                className='absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors'
                title='Xóa ảnh'
              >
                <X className='w-3.5 h-3.5' />
              </button>
            </>
          ) : (
            <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground'>
              <ImageIcon className='w-10 h-10 opacity-30' />
              <span className='text-sm'>Chưa có ảnh</span>
            </div>
          )}
        </div>

        {/* Upload dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-pink-400 bg-pink-50' : 'border-gray-200'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-pink-400 hover:bg-pink-50'}
          `}
        >
          <input {...getInputProps()} />
          <div className='flex flex-col items-center gap-2'>
            <Upload className='w-5 h-5 text-muted-foreground' />
            <p className='text-sm text-muted-foreground'>
              {uploading
                ? 'Đang tải lên...'
                : isDragActive
                  ? 'Thả ảnh vào đây...'
                  : currentUrl
                    ? 'Kéo thả hoặc click để thay ảnh'
                    : 'Kéo thả hoặc click để chọn ảnh'}
            </p>
            <p className='text-xs text-muted-foreground'>JPG, PNG, WebP</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
