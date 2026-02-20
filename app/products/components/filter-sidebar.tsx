'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Category {
  id: string
  name: string
  icon: string | null
}

interface FilterSidebarProps {
  categories: Category[]
  activeCategory?: string
  activeSearch?: string
  totalCount: number
}

export function FilterSidebar({
  categories,
  activeCategory,
  activeSearch,
  totalCount,
}: FilterSidebarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(activeSearch ?? '')
  const [mobileOpen, setMobileOpen] = useState(false)
  const mounted = useRef(false)

  // Debounced search navigation — skip on initial mount
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    const handler = setTimeout(() => {
      const params = new URLSearchParams()
      if (activeCategory) params.set('category', activeCategory)
      if (search.trim()) params.set('search', search.trim())
      router.push(`/products?${params.toString()}`, { scroll: false })
    }, 400)
    return () => clearTimeout(handler)
  }, [search, activeCategory, router])

  const activeFiltersCount = (activeCategory ? 1 : 0) + (activeSearch ? 1 : 0)

  const categoryList = (
    <div className='space-y-1'>
      <a
        href='/products'
        className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
          !activeCategory
            ? 'bg-primary/20 text-foreground'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <span className='text-base'>🏷️</span>
        Tất cả sản phẩm
        {!activeCategory && (
          <Badge variant='secondary' className='ml-auto text-xs px-1.5 py-0'>
            {totalCount}
          </Badge>
        )}
      </a>

      {categories.map((cat) => {
        const isActive = activeCategory === cat.name
        return (
          <a
            key={cat.id}
            href={`/products?category=${encodeURIComponent(cat.name)}${activeSearch ? `&search=${encodeURIComponent(activeSearch)}` : ''}`}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary/20 text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <span className='text-base'>{cat.icon || '📦'}</span>
            {cat.name}
            {isActive && (
              <Badge variant='secondary' className='ml-auto text-xs px-1.5 py-0'>
                {totalCount}
              </Badge>
            )}
          </a>
        )
      })}
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar (lg+) ───────────────────── */}
      <aside className='hidden lg:flex flex-col gap-6 w-64 shrink-0'>
        {/* Search */}
        <div className='relative'>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Tìm sản phẩm...'
            className='pl-9 rounded-xl'
          />
          <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
          {search && (
            <button
              onClick={() => setSearch('')}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
            >
              <X className='w-3.5 h-3.5' />
            </button>
          )}
        </div>

        {/* Category list */}
        <div className='space-y-2'>
          <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3'>
            Danh mục
          </p>
          {categoryList}
        </div>

        {/* Active filters */}
        {activeFiltersCount > 0 && (
          <div className='pt-2 border-t border-border'>
            <a
              href='/products'
              className='flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors'
            >
              <X className='w-3.5 h-3.5' />
              Xóa bộ lọc
            </a>
          </div>
        )}
      </aside>

      {/* ── Mobile bar (< lg) ────────────────────────── */}
      <div className='lg:hidden space-y-3'>
        <div className='flex gap-2'>
          {/* Search */}
          <div className='relative flex-1'>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder='Tìm sản phẩm...'
              className='pl-9 rounded-xl'
            />
            <Search className='w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' />
            {search && (
              <button
                onClick={() => setSearch('')}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
              >
                <X className='w-3.5 h-3.5' />
              </button>
            )}
          </div>

          {/* Filter toggle button */}
          <Button
            variant='outline'
            size='sm'
            className='shrink-0 gap-1.5 rounded-xl'
            onClick={() => setMobileOpen((v) => !v)}
          >
            <SlidersHorizontal className='w-4 h-4' />
            Lọc
            {activeFiltersCount > 0 && (
              <Badge className='ml-0.5 px-1.5 py-0 text-xs h-4 min-w-4 flex items-center justify-center'>
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 transition-transform',
                mobileOpen && 'rotate-180'
              )}
            />
          </Button>
        </div>

        {/* Collapsible category panel */}
        {mobileOpen && (
          <div className='bg-card border border-border rounded-2xl p-4 space-y-3 cute-shadow'>
            <div className='flex items-center justify-between'>
              <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                Danh mục
              </p>
              {activeFiltersCount > 0 && (
                <a
                  href='/products'
                  className='text-xs text-muted-foreground hover:text-destructive flex items-center gap-1'
                >
                  <X className='w-3 h-3' />
                  Xóa bộ lọc
                </a>
              )}
            </div>
            {categoryList}
          </div>
        )}

        {/* Active category chip */}
        {activeCategory && !mobileOpen && (
          <div className='flex items-center gap-2'>
            <span className='text-sm text-muted-foreground'>Đang lọc:</span>
            <a
              href='/products'
              className='inline-flex items-center gap-1.5 text-sm bg-primary/20 text-foreground px-3 py-1 rounded-full'
            >
              {categories.find((c) => c.name === activeCategory)?.icon}{' '}
              {activeCategory}
              <X className='w-3 h-3' />
            </a>
          </div>
        )}
      </div>
    </>
  )
}
