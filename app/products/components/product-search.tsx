'use client'

import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProductSearchProps {
  category?: string
}

export function ProductSearch({ category }: ProductSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialSearch = searchParams.get('search') ?? ''
  const [value, setValue] = useState(initialSearch)

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams()

      if (category) params.set('category', category)
      if (value.trim()) params.set('search', value.trim())

      router.push(`/products?${params.toString()}`, {
        scroll: false
      })
    }, 400) // debounce 400ms

    return () => clearTimeout(handler)
  }, [value, category, router])

  return (
    <div className='relative w-full'>
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder='Tìm theo tên sản phẩm...'
        className='pl-9 w-full rounded-full'
      />
      <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
    </div>
  )
}
