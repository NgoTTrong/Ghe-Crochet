import { Header } from '@/components/header'

export default function ProductsLoading() {
  return (
    <div className='min-h-screen'>
      <Header />

      <main className='py-8 lg:py-12'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          
          {/* Page heading skeleton */}
          <div className='mb-8 space-y-2'>
            <div className='h-8 lg:h-10 w-48 bg-muted rounded-lg animate-pulse' />
            <div className='h-5 w-32 bg-muted rounded-lg animate-pulse' />
          </div>

          {/* Sidebar + Content */}
          <div className='flex flex-col lg:flex-row gap-8'>

            {/* Filters skeleton */}
            <aside className='w-full lg:w-64 flex-shrink-0 space-y-4'>
              <div className='h-6 w-20 bg-muted rounded animate-pulse' />
              <div className='space-y-2'>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className='h-9 w-full bg-muted rounded animate-pulse' />
                ))}
              </div>
              <div className='h-6 w-20 bg-muted rounded animate-pulse' />
              <div className='h-10 w-full bg-muted rounded animate-pulse' />
            </aside>

            {/* Products skeleton */}
            <div className='flex-1 min-w-0'>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6'>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className='space-y-3'>
                    <div className='aspect-square rounded-2xl bg-muted animate-pulse' />
                    <div className='space-y-2'>
                      <div className='h-4 w-full bg-muted rounded animate-pulse' />
                      <div className='h-4 w-2/3 bg-muted rounded animate-pulse' />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
