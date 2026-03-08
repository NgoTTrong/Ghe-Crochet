import { Header } from '@/components/header'

export default function Loading() {
  return (
    <div className='min-h-screen'>
      <Header />

      <main>
        {/* Hero skeleton */}
        <section className='relative py-20 lg:py-32 overflow-hidden'>
          <div className='container mx-auto px-4 sm:px-6 lg:px-8 relative'>
            <div className='grid lg:grid-cols-2 gap-12 items-center'>
              <div className='space-y-4'>
                <div className='h-6 w-32 bg-muted rounded-full animate-pulse' />
                <div className='space-y-3'>
                  <div className='h-12 w-3/4 bg-muted rounded animate-pulse' />
                  <div className='h-12 w-1/2 bg-muted rounded animate-pulse' />
                </div>
                <div className='h-16 w-40 bg-muted rounded-full animate-pulse' />
              </div>
              <div className='aspect-square rounded-3xl bg-muted animate-pulse' />
            </div>
          </div>
        </section>

        {/* Featured section skeleton */}
        <section className='py-12 lg:py-16'>
          <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='mb-8 space-y-2'>
              <div className='h-8 w-48 bg-muted rounded-lg animate-pulse' />
              <div className='h-5 w-64 bg-muted rounded-lg animate-pulse' />
            </div>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6'>
              {Array.from({ length: 4 }).map((_, i) => (
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
        </section>

        {/* Discounted section skeleton */}
        <section className='py-12 lg:py-16'>
          <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='mb-8 space-y-2'>
              <div className='h-8 w-48 bg-muted rounded-lg animate-pulse' />
              <div className='h-5 w-64 bg-muted rounded-lg animate-pulse' />
            </div>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6'>
              {Array.from({ length: 4 }).map((_, i) => (
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
        </section>
      </main>
    </div>
  )
}
