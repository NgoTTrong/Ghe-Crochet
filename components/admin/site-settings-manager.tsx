'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { CheckCircle2, Tag } from 'lucide-react'
import { useState } from 'react'

interface SiteSettingsManagerProps {
  initialShowDiscounts: boolean
}

export function SiteSettingsManager({
  initialShowDiscounts
}: SiteSettingsManagerProps) {
  const [showDiscounts, setShowDiscounts] = useState(initialShowDiscounts)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const toggle = async (next: boolean) => {
    setShowDiscounts(next) // optimistic
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_discounts: next })
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error('Settings save error:', err)
      setShowDiscounts(!next) // revert
      alert('Có lỗi khi lưu cài đặt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className='shadow-sm border border-gray-200'>
      <CardHeader>
        <CardTitle className='text-base flex items-center gap-2 text-gray-900'>
          <Tag className='w-4 h-4' />
          Giá khuyến mãi
          {saved && (
            <span className='flex items-center gap-1 text-green-600 text-sm font-normal'>
              <CheckCircle2 className='w-3.5 h-3.5' />
              Đã lưu
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Bật để hiển thị giá giảm / khuyến mãi trên toàn bộ website. Tắt thì mọi
          nơi chỉ hiện giá gốc.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <label className='flex items-center justify-between gap-4 cursor-pointer'>
          <span className='text-sm font-medium text-gray-900'>
            Hiện giá khuyến mãi
          </span>
          <Switch
            checked={showDiscounts}
            onCheckedChange={toggle}
            disabled={saving}
          />
        </label>
      </CardContent>
    </Card>
  )
}
