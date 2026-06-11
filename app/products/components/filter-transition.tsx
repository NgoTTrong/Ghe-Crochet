'use client'

import { createContext, useContext, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterTransitionValue {
  isPending: boolean
  navigate: (url: string) => void
}

const FilterTransitionContext = createContext<FilterTransitionValue>({
  isPending: false,
  navigate: () => {},
})

export function useFilterTransition() {
  return useContext(FilterTransitionContext)
}

export function FilterTransitionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const navigate = (url: string) => {
    startTransition(() => {
      router.push(url, { scroll: false })
    })
  }

  return (
    <FilterTransitionContext.Provider value={{ isPending, navigate }}>
      {children}
    </FilterTransitionContext.Provider>
  )
}

// Dim + spinner over the product grid while a filter/sort change is loading.
export function GridLoadingOverlay({ className }: { className?: string }) {
  const { isPending } = useFilterTransition()
  if (!isPending) return null
  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex items-start justify-center bg-background/60 backdrop-blur-[1px] rounded-2xl',
        className
      )}
    >
      <div className='sticky top-24 mt-24 flex items-center gap-2 rounded-full bg-card px-4 py-2 cute-shadow border border-border'>
        <Loader2 className='w-4 h-4 animate-spin text-primary' />
        <span className='text-sm font-medium text-foreground'>Đang tải...</span>
      </div>
    </div>
  )
}
