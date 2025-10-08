import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ProductCard } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, Sparkles, Gift } from 'lucide-react';

export default async function HomePage() {
  const supabase = await createClient();
  let featuredProducts: any[] = [];
  const { data: featuredData } = await supabase
    .from('products')
    .select(
      `*,
        product_categories(
          categories(
            id,
            name,
            description
          )
        )`
    )
    .eq('is_featured', true)
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .limit(6);

  featuredProducts = (featuredData || []).map((product) => ({
    ...product,
    categories: product.product_categories.map((pc: any) => pc.categories),
  }));

  // Discounted products
  let discountedProducts: any[] = [];
  const { data: discountedData } = await supabase
    .from('products')
    .select(
      `*,
        product_categories(
          categories(
            id,
            name,
            description
          )
        )`
    )
    .not('promotion_price', 'is', null)
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .limit(6);

  discountedProducts = (discountedData || []).map((product) => ({
    ...product,
    categories: product.product_categories.map((pc: any) => pc.categories),
  }));
  console.log('🚀 ~ HomePage ~ discountedProducts:', discountedProducts);

  // Categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')
    .limit(4);

  return (
    <div className='min-h-screen'>
      <Header />

      <main>
        {/* Hero Section */}
        <section className='relative py-20 lg:py-32 overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10' />
          <div className='container mx-auto px-4 sm:px-6 lg:px-8 relative'>
            <div className='grid lg:grid-cols-2 gap-12 items-center'>
              <div className='space-y-8'>
                <div className='space-y-4'>
                  <Badge className='bg-accent text-accent-foreground w-fit'>
                    <Sparkles className='w-3 h-3 mr-1' />
                    Handmade với tình yêu
                  </Badge>
                  <h1 className='text-4xl lg:text-6xl font-bold leading-tight text-balance'>
                    Khám phá thế giới
                    <span className='gradient-text block'>
                      Crochet đáng yêu
                    </span>
                  </h1>
                  <p className='text-lg text-muted-foreground leading-relaxed text-pretty'>
                    Mỗi sản phẩm tại Ghẹ Crochet đều được tạo ra bằng tay với
                    tình yêu và sự tỉ mỉ. Từ những chú amigurumi dễ thương đến
                    các phụ kiện thực dụng, chúng tôi mang đến những món quà độc
                    đáo cho cuộc sống của bạn.
                  </p>
                </div>

                <div className='flex flex-col sm:flex-row gap-4'>
                  <Button
                    asChild
                    size='lg'
                    className='bg-primary hover:bg-primary/90 text-primary-foreground rounded-full'
                  >
                    <Link href='/products'>
                      <Gift className='w-4 h-4 mr-2' />
                      Khám phá sản phẩm
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant='outline'
                    size='lg'
                    className='rounded-full bg-transparent'
                  >
                    <Link href='/about'>Tìm hiểu thêm</Link>
                  </Button>
                </div>

                <div className='flex items-center gap-6 pt-4'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-primary'>500+</div>
                    <div className='text-sm text-muted-foreground'>
                      Sản phẩm
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-secondary'>
                      1000+
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Khách hàng
                    </div>
                  </div>
                  <div className='text-center'>
                    <div className='flex items-center gap-1 text-2xl font-bold text-accent'>
                      <Star className='w-5 h-5 fill-current' />
                      4.9
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Đánh giá
                    </div>
                  </div>
                </div>
              </div>

              <div className='relative'>
                <div className='aspect-square rounded-3xl overflow-hidden cute-shadow'>
                  <Image
                    src='/main-image.jpg'
                    alt='Bộ sưu tập Ghẹ Crochet'
                    width={600}
                    height={600}
                    className='object-cover w-full h-full'
                    priority
                  />
                </div>
                <div className='absolute -top-4 -right-4 w-20 h-20 bg-accent rounded-full flex items-center justify-center cute-shadow'>
                  <Heart className='w-8 h-8 text-accent-foreground' />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className='py-16 lg:py-24'>
          <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center space-y-4 mb-12'>
              <h2 className='text-3xl lg:text-4xl font-bold'>
                Danh mục sản phẩm
              </h2>
              <p className='text-lg text-muted-foreground max-w-2xl mx-auto text-pretty'>
                Khám phá các danh mục sản phẩm đa dạng của chúng tôi
              </p>
            </div>

            <div className='grid grid-cols-2 lg:grid-cols-4 gap-6'>
              {categories?.map((category) => (
                <Link
                  key={category.id}
                  href={`/products?category=${category.name.toLowerCase()}`}
                >
                  <Card className='group border-0 cute-shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-1'>
                    <CardContent className='p-6 text-center space-y-4'>
                      <div className='w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors'>
                        <Heart className='w-8 h-8 text-primary' />
                      </div>
                      <div>
                        <h3 className='font-semibold text-foreground group-hover:text-primary transition-colors'>
                          {category.name}
                        </h3>
                        <p className='text-sm text-muted-foreground mt-1'>
                          {category.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Discounted Products Section */}
        {discountedProducts.length > 0 && (
          <section className='py-16 lg:py-24 bg-red-50'>
            <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
              <div className='text-center space-y-4 mb-12'>
                <Badge className='bg-red-500 text-white'>
                  <Sparkles className='w-3 h-3 mr-1' />
                  Giảm giá đặc biệt
                </Badge>
                <h2 className='text-3xl lg:text-4xl font-bold text-red-600'>
                  Ưu đãi không thể bỏ lỡ
                </h2>
                <p className='text-lg text-muted-foreground max-w-2xl mx-auto text-pretty'>
                  Những sản phẩm đang giảm giá hấp dẫn dành riêng cho bạn
                </p>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
                {discountedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              <div className='text-center mt-12'>
                <Button
                  asChild
                  size='lg'
                  variant='outline'
                  className='rounded-full bg-transparent'
                >
                  <Link href='/products'>Xem tất cả khuyến mãi</Link>
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* Featured Products Section */}
        <section className='py-16 lg:py-24 bg-muted/30'>
          <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center space-y-4 mb-12'>
              <Badge className='bg-primary text-primary-foreground'>
                <Star className='w-3 h-3 mr-1' />
                Sản phẩm nổi bật
              </Badge>
              <h2 className='text-3xl lg:text-4xl font-bold'>
                Được yêu thích nhất
              </h2>
              <p className='text-lg text-muted-foreground max-w-2xl mx-auto text-pretty'>
                Những sản phẩm được khách hàng yêu thích và đánh giá cao nhất
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              {featuredProducts?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className='text-center mt-12'>
              <Button
                asChild
                size='lg'
                variant='outline'
                className='rounded-full bg-transparent'
              >
                <Link href='/products'>Xem tất cả sản phẩm</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className='py-16 lg:py-24'>
          <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
            <Card className='border-0 cute-shadow bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5'>
              <CardContent className='p-8 lg:p-12 text-center space-y-6'>
                <div className='space-y-4'>
                  <h2 className='text-3xl lg:text-4xl font-bold'>
                    Bạn có ý tưởng riêng?
                  </h2>
                  <p className='text-lg text-muted-foreground max-w-2xl mx-auto text-pretty'>
                    Chúng tôi nhận đặt hàng theo yêu cầu. Hãy chia sẻ ý tưởng
                    của bạn và chúng tôi sẽ biến nó thành hiện thực!
                  </p>
                </div>

                <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                  <Button
                    asChild
                    size='lg'
                    className='bg-primary hover:bg-primary/90 text-primary-foreground rounded-full'
                  >
                    <Link href='/contact'>
                      <Heart className='w-4 h-4 mr-2' />
                      Đặt hàng theo yêu cầu
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant='outline'
                    size='lg'
                    className='rounded-full bg-transparent'
                  >
                    <Link href='/products'>Xem bộ sưu tập</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
