import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  description: string
  price: number
  promotion_price: number
  categories?: Array<{
    id: string
    name: string
  }>
  images: string[]
  is_featured: boolean
  is_available: boolean
}

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price)
  }

  const hasSale =
    product?.promotion_price !== null && product?.promotion_price !== 0
  const primaryCategory = product.categories?.[0]
  const extraCategoryCount = (product.categories?.length ?? 0) - 1

  return (
    <Link href={`/products/${product.id}`} className='block h-full'>
      <Card className='group h-full overflow-hidden border-0 py-0 gap-0 cute-shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
        <div className='relative aspect-square overflow-hidden bg-muted rounded-t-lg'>
          <Image
            src={product.images[0] || '/placeholder.svg?height=300&width=300'}
            alt={product.name}
            width={300}
            height={300}
            className='object-cover w-full h-full group-hover:scale-105 transition-transform duration-300'
          />

          {primaryCategory && (
            <div className='absolute top-2 left-2 flex gap-1 max-w-[calc(100%-1rem)]'>
              <Badge
                variant='secondary'
                className='bg-white/85 backdrop-blur-sm text-foreground text-[10px] md:text-xs font-medium shadow-sm truncate'
              >
                {primaryCategory.name}
              </Badge>
              {extraCategoryCount > 0 && (
                <Badge
                  variant='secondary'
                  className='bg-white/85 backdrop-blur-sm text-foreground text-[10px] md:text-xs font-medium shadow-sm'
                >
                  +{extraCategoryCount}
                </Badge>
              )}
            </div>
          )}

          {product.is_featured && (
            <Badge
              variant='secondary'
              className='absolute top-2 right-2 bg-accent text-accent-foreground text-[10px] md:text-xs shadow-sm'
            >
              Nổi bật
            </Badge>
          )}

          {hasSale && (
            <Badge className='absolute bottom-2 left-2 bg-red-500 text-white text-[10px] md:text-xs shadow-sm hover:bg-red-500'>
              -
              {Math.round(
                ((product.price - product.promotion_price) / product.price) *
                  100
              )}
              %
            </Badge>
          )}

          {!product.is_available && (
            <div className='absolute inset-0 bg-black/50 flex items-center justify-center'>
              <span className='bg-white text-foreground font-semibold px-3 py-1 rounded-full text-sm'>
                Hết hàng
              </span>
            </div>
          )}
        </div>

        <CardContent className='p-2 md:p-5 flex flex-col gap-0.5 md:gap-1.5 flex-1'>
          <h3 className='font-semibold text-xs md:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1 md:line-clamp-2 leading-tight md:leading-snug'>
            {product.name}
          </h3>

          <div className='hidden md:block'>
            <p className='text-sm text-muted-foreground line-clamp-3 leading-relaxed'>
              {product.description}
            </p>
          </div>

          <div className='hidden md:block h-px bg-border/60 mt-2' />

          <div className='flex items-end justify-between gap-2 mt-auto'>
            <div className='flex items-baseline gap-1.5 md:gap-2 flex-wrap'>
              {hasSale ? (
                <>
                  <span className='font-bold text-sm md:text-xl text-primary'>
                    {formatPrice(product.promotion_price)}
                  </span>
                  <span className='text-[10px] md:text-sm text-muted-foreground line-through'>
                    {formatPrice(product.price)}
                  </span>
                </>
              ) : (
                <span className='font-bold text-sm md:text-xl text-foreground'>
                  {formatPrice(product.price)}
                </span>
              )}
            </div>

            <span className='hidden md:inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 translate-x-[-4px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300'>
              Xem
              <ArrowRight className='w-3.5 h-3.5' />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
