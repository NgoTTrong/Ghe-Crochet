import Image from 'next/image'
import logoImage from '@/public/logo.jpg'

export function LoadingScreen() {
  return (
    <div className='min-h-screen flex flex-col items-center justify-center gap-6 bg-background'>
      <div className='relative h-24 w-24'>
        {/* Spinning ring */}
        <div className='absolute inset-0 rounded-full border-4 border-muted border-t-primary animate-spin' />
        {/* Logo in center */}
        <div className='absolute inset-2 overflow-hidden rounded-full'>
          <Image
            src={logoImage}
            alt='logo'
            fill
            className='object-cover'
            priority
          />
        </div>
      </div>
      <p className='text-sm text-muted-foreground animate-pulse'>Đang tải...</p>
    </div>
  )
}
