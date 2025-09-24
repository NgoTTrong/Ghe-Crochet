import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  promotion_price: number;
  categories?: Array<{
    id: string;
    name: string;
  }>;
  images: string[];
  is_featured: boolean;
  is_available: boolean;
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  return (
    <Link href={`/products/${product.id}`}>
      <Card className='group overflow-hidden border-0 cute-shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
        <div className='aspect-square overflow-hidden bg-muted rounded-t-lg'>
          <Image
            src={product.images[0] || '/placeholder.svg?height=300&width=300'}
            alt={product.name}
            width={300}
            height={300}
            className='object-cover w-full h-full group-hover:scale-105 transition-transform duration-300'
          />
        </div>
        <CardContent className='p-4 space-y-3'>
          <div className='flex items-start justify-between gap-2'>
            <h3 className='font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2'>
              {product.name}
            </h3>
            {product.is_featured && (
              <Badge
                variant='secondary'
                className='bg-accent text-accent-foreground text-xs'
              >
                Nổi bật
              </Badge>
            )}
          </div>

          <p className='text-sm text-muted-foreground line-clamp-2'>
            {product.description}
          </p>

          <div className='flex items-center justify-between gap-2'>
            <div className='flex flex-col'>
              <span
                className={cn(
                  'font-bold text-lg text-black',
                  product?.promotion_price !== null &&
                    product?.promotion_price !== 0 &&
                    'line-through text-primary'
                )}
              >
                {formatPrice(product.price)}
              </span>
              {product?.promotion_price !== null &&
                product?.promotion_price !== 0 && (
                  <span className='font-bold text-lg text-red-500'>
                    {formatPrice(product.promotion_price)}
                  </span>
                )}
            </div>

            <div className='flex flex-col gap-1 items-end'>
              {product.categories?.slice(0, 2).map((category) => (
                <Badge key={category.id} variant='outline' className='text-xs'>
                  {category.name}
                </Badge>
              ))}
              {product.categories && product.categories.length > 2 && (
                <Badge variant='outline' className='text-xs'>
                  +{product.categories.length - 2}
                </Badge>
              )}
            </div>
          </div>

          {!product.is_available && (
            <Badge variant='destructive' className='w-full justify-center'>
              Hết hàng
            </Badge>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
