import { AdminHeader } from '@/components/admin/admin-header'

export default function AdminCategoriesLoading() {
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

        {/* Categories grid skeleton */}
        <div className='grid gap-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='bg-white rounded-xl shadow-sm border p-6'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3 space-y-2 flex-1'>
                  <div className='h-8 w-8 bg-muted rounded animate-pulse' />
                  <div className='h-6 w-48 bg-muted rounded animate-pulse' />
                </div>
                <div className='flex gap-2'>
                  <div className='h-8 w-8 bg-muted rounded animate-pulse' />
                  <div className='h-8 w-8 bg-muted rounded animate-pulse' />
                </div>
              </div>
              <div className='mt-4 h-5 w-64 bg-muted rounded animate-pulse' />
              <div className='mt-2 h-6 w-32 bg-muted rounded-full animate-pulse' />
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}
