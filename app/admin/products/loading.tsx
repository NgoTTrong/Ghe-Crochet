import { AdminHeader } from '@/components/admin/admin-header'

export default function AdminProductsLoading() {
  return (
    <div className='min-h-screen bg-gray-50'>
      <AdminHeader />

      <main className='container mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        
        {/* Header skeleton */}
        <div className='flex items-center justify-between mb-8'>
          <div className='space-y-2'>
            <div className='h-8 w-64 bg-white rounded-lg animate-pulse shadow-sm' />
            <div className='h-5 w-96 bg-white rounded-lg animate-pulse shadow-sm' />
          </div>
          <div className='h-10 w-40 bg-black rounded-full animate-pulse' />
        </div>

        {/* Table skeleton */}
        <div className='bg-white rounded-xl shadow-sm border p-6'>
          <div className='mb-6'>
            <div className='h-6 w-48 bg-muted rounded animate-pulse' />
          </div>
          <div className='space-y-4'>
            <div className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg'>
              <div className='w-16 h-16 bg-muted rounded-lg animate-pulse' />
              <div className='flex-1 space-y-2'>
                <div className='h-4 w-3/4 bg-muted rounded animate-pulse' />
                <div className='h-3 w-1/2 bg-muted rounded animate-pulse' />
              </div>
              <div className='h-6 w-20 bg-muted rounded animate-pulse' />
              <div className='h-6 w-20 bg-muted rounded animate-pulse' />
              <div className='flex gap-2'>
                <div className='h-8 w-8 bg-muted rounded animate-pulse' />
                <div className='h-8 w-8 bg-muted rounded animate-pulse' />
              </div>
            </div>
            <div className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg'>
              <div className='w-16 h-16 bg-muted rounded-lg animate-pulse' />
              <div className='flex-1 space-y-2'>
                <div className='h-4 w-3/4 bg-muted rounded animate-pulse' />
                <div className='h-3 w-1/2 bg-muted rounded animate-pulse' />
              </div>
              <div className='h-6 w-20 bg-muted rounded animate-pulse' />
              <div className='h-6 w-20 bg-muted rounded animate-pulse' />
              <div className='flex gap-2'>
                <div className='h-8 w-8 bg-muted rounded animate-pulse' />
                <div className='h-8 w-8 bg-muted rounded animate-pulse' />
              </div>
            </div>
            <div className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg'>
              <div className='w-16 h-16 bg-muted rounded-lg animate-pulse' />
              <div className='flex-1 space-y-2'>
                <div className='h-4 w-3/4 bg-muted rounded animate-pulse' />
                <div className='h-3 w-1/2 bg-muted rounded animate-pulse' />
              </div>
              <div className='h-6 w-20 bg-muted rounded animate-pulse' />
              <div className='h-6 w-20 bg-muted rounded animate-pulse' />
              <div className='flex gap-2'>
                <div className='h-8 w-8 bg-muted rounded animate-pulse' />
                <div className='h-8 w-8 bg-muted rounded animate-pulse' />
              </div>
            </div>
            <div className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg'>
              <div className='w-16 h-16 bg-muted rounded-lg animate-pulse' />
              <div className='flex-1 space-y-2'>
                <div className='h-4 w-3/4 bg-muted rounded animate-pulse' />
                <div className='h-3 w-1/2 bg-muted rounded animate-pulse' />
              </div>
              <div className='h-6 w-20 bg-muted rounded animate-pulse' />
              <div className='h-6 w-20 bg-muted rounded animate-pulse' />
              <div className='flex gap-2'>
                <div className='h-8 w-8 bg-muted rounded animate-pulse' />
                <div className='h-8 w-8 bg-muted rounded animate-pulse' />
              </div>
            </div>
            <div className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg'>
              <div className='w-16 h-16 bg-muted rounded-lg animate-pulse' />
              <div className='flex-1 space-y-2'>
                <div className='h-4 w-3/4 bg-muted rounded animate-pulse' />
                <div className='h-3 w-1/2 bg-muted rounded animate-pulse' />
              </div>
              <div className='h-6 w-20 bg-muted rounded animate-pulse' />
              <div className='h-6 w-20 bg-muted rounded animate-pulse' />
              <div className='flex gap-2'>
                <div className='h-8 w-8 bg-muted rounded animate-pulse' />
                <div className='h-8 w-8 bg-muted rounded animate-pulse' />
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
