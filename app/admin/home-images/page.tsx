import { createClient } from '@/lib/supabase/server'
import { HomeImagesManager } from '@/components/admin/home-images-manager'
import { ImageIcon } from 'lucide-react'

export default async function HomeImagesPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['home_hero_image', 'home_custom_order_image'])

  const settings: Record<string, string> = {}
  for (const row of data || []) {
    settings[row.key] = row.value || ''
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-1'>
        <h1 className='text-2xl font-bold flex items-center gap-2 text-gray-900'>
          <ImageIcon className='w-6 h-6' />
          Ảnh trang chủ
        </h1>
        <p className='text-gray-600'>
          Quản lý hình ảnh hiển thị trên trang chủ
        </p>
      </div>

      <HomeImagesManager initialSettings={settings} />
    </div>
  )
}
