export default function AdminLoading() {
  return (
    <>
      {/* Header skeleton */}
      <div className='mb-8 space-y-2'>
        <div className='h-8 w-64 bg-white rounded-lg animate-pulse shadow-sm' />
        <div className='h-5 w-96 bg-white rounded-lg animate-pulse shadow-sm' />
      </div>

      {/* Stats cards skeleton */}
      <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='bg-white rounded-xl shadow-sm p-6 space-y-3'>
            <div className='h-4 w-20 bg-muted rounded animate-pulse' />
            <div className='h-8 w-24 bg-muted rounded animate-pulse' />
          </div>
        ))}
      </div>

      {/* Recent products skeleton */}
      <div className='bg-white rounded-xl shadow-sm border p-6'>
        <div className='mb-6'>
          <div className='h-6 w-48 bg-muted rounded animate-pulse' />
        </div>
        <div className='space-y-4'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg'>
              <div className='w-16 h-16 bg-muted rounded-lg animate-pulse' />
              <div className='flex-1 space-y-2'>
                <div className='h-4 w-3/4 bg-muted rounded animate-pulse' />
                <div className='h-3 w-1/2 bg-muted rounded animate-pulse' />
              </div>
              <div className='h-6 w-20 bg-muted rounded animate-pulse' />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
