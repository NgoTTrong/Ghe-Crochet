import { Header } from '@/components/header'

export default function ProductLoading() {
  return (
    <div className='min-h-screen'>
      <Header />

      <main className='py-8 lg:py-12'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          
          {/* Breadcrumb skeleton */}
          <div className='mb-6'>
            <div className='h-5 w-48 bg-muted rounded animate-pulse' />
          </div>

          {/* Product detail skeleton */}
          <div className='grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16'>
            
            {/* Images skeleton */}
            <div className='space-y-4'>
              <div className='aspect-square rounded-2xl bg-muted animate-pulse' />
              <div className='grid grid-cols-4 gap-2'>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className='aspect-square rounded-xl bg-muted animate-pulse' />
                ))}
              </div>
            </div>

            {/* Product info skeleton */}
            <div className='space-y-6'>
              <div className='space-y-2'>
                <div className='h-6 w-20 bg-muted rounded animate-pulse' />
                <div className='space-y-2'>
                  <div className='h-10 w-3/4 bg-muted rounded animate-pulse' />
                  <div className='h-5 w-full bg-muted rounded animate-pulse' />
                </div>
              </div>

              <div className='flex items-center gap-2'>
                <div className='h-8 w-8 bg-muted rounded-full animate-pulse' />
                <div className='h-8 w-8 bg-muted rounded-full animate-pulse' />
              </div>

              <div className='space-y-2'>
                <div className='h-8 w-32 bg-muted rounded animate-pulse' />
              </div>

              <div className='space-y-4'>
                <div className='h-12 w-full bg-muted rounded-full animate-pulse' />
                <div className='grid grid-cols-3 gap-4'>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className='space-y-2 text-center'>
                      <div className='h-12 w-12 mx-auto rounded-full bg-muted animate-pulse' />
                      <div className='h-4 w-full bg-muted rounded animate-pulse' />
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Description skeleton */}
          <div className='bg-white rounded-2xl shadow-sm border p-8 lg:p-12 mb-16'>
            <div className='max-w-4xl mx-auto space-y-6'>
              <div className='text-center space-y-2'>
                <div className='h-8 w-64 mx-auto bg-muted rounded animate-pulse' />
                <div className='h-5 w-96 mx-auto bg-muted rounded animate-pulse' />
              </div>
              <div className='grid lg:grid-cols-2 gap-8 items-start'>
                <div className='space-y-4'>
                  <div className='h-6 w-48 bg-muted rounded animate-pulse' />
                  <div className='space-y-3'>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className='flex items-start gap-2'>
                        <div className='w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0 animate-pulse' />
                        <div className='h-4 flex-1 bg-muted rounded animate-pulse' />
                      </div>
                    ))}
                  </div>
                </div>
                <div className='space-y-4'>
                  <div className='aspect-video rounded-xl bg-muted animate-pulse' />
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
