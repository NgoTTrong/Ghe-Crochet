import { AnimatedSection } from '@/components/animated-section'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { ProductCard } from '@/components/product-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowRight,
  CheckCircle2,
  Gift,
  Heart,
  Palette,
  Ruler,
  Sparkles,
  Star,
  Tag
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = await createClient()

  // Site images
  const { data: siteSettingsData } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', ['home_hero_image', 'home_custom_order_image'])

  const siteSettings: Record<string, string> = {}
  for (const row of siteSettingsData || []) {
    siteSettings[row.key] = row.value || ''
  }
  const heroImage = siteSettings['home_hero_image'] || '/main-image.jpg'
  const customOrderImage =
    siteSettings['home_custom_order_image'] || '/main-image.jpg'

  let featuredProducts: any[] = []
  const { data: featuredData } = await supabase
    .from('products')
    .select(
      `*,
        product_categories(
          categories(id, name, description)
        )`
    )
    .eq('is_featured', true)
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .limit(6)

  featuredProducts = (featuredData || []).map((product) => ({
    ...product,
    categories: product.product_categories.map((pc: any) => pc.categories)
  }))

  let discountedProducts: any[] = []
  const { data: discountedData } = await supabase
    .from('products')
    .select(
      `*,
        product_categories(
          categories(id, name, description)
        )`
    )
    .not('promotion_price', 'is', null)
    .eq('is_available', true)
    .order('created_at', { ascending: false })
    .limit(6)

  discountedProducts = (discountedData || []).map((product) => ({
    ...product,
    categories: product.product_categories.map((pc: any) => pc.categories)
  }))

  return (
    <div className='min-h-screen'>
      <Header />

      <main>
        {/* ── Hero ─────────────────────────────────────── */}
        <section className='relative py-20 lg:py-32 overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10' />
          <div className='absolute top-10 right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none' />
          <div className='absolute bottom-10 left-10 w-48 h-48 bg-secondary/20 rounded-full blur-3xl pointer-events-none' />

          <div className='container mx-auto px-4 sm:px-6 lg:px-8 relative'>
            <div className='grid lg:grid-cols-2 gap-12 items-center'>
              <div className='space-y-8'>
                <div className='space-y-4'>
                  <Badge className='bg-accent text-accent-foreground w-fit animate-fade-in'>
                    <Sparkles className='w-3 h-3 mr-1' />
                    Handmade với tình yêu
                  </Badge>
                  <h1 className='text-3xl lg:text-[56px] font-bold leading-tight text-balance animate-fade-in-up delay-100'>
                    Khám phá Thế giới
                    <span className='gradient-text block whitespace-nowrap'>
                      Handmade Đầy Màu sắc
                    </span>
                  </h1>
                  <p className='text-base lg:text-lg text-muted-foreground leading-relaxed text-pretty animate-fade-in-up delay-200'>
                    Không chỉ dừng lại ở những sợi len, chúng tôi mang đến bộ
                    sưu tập đa chất liệu. Dù là phụ kiện cá nhân hay quà tặng ý
                    nghĩa, mỗi món đồ đều được chăm chút để kể lên câu chuyện
                    riêng của bạn.
                  </p>
                </div>

                <div className='flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-300'>
                  <Button
                    asChild
                    size='lg'
                    className='bg-primary hover:bg-primary/90 text-primary-foreground rounded-full'
                  >
                    <Link href='/products'>
                      <Gift className='w-4 h-4 mr-2' />
                      Xem bộ sưu tập
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

                <div className='flex items-center gap-8 pt-4 animate-fade-in-up delay-400'>
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-primary'>500+</div>
                    <div className='text-sm text-muted-foreground'>
                      Sản phẩm
                    </div>
                  </div>
                  <div className='w-px h-10 bg-border' />
                  <div className='text-center'>
                    <div className='text-2xl font-bold text-primary'>1000+</div>
                    <div className='text-sm text-muted-foreground'>
                      Khách hàng
                    </div>
                  </div>
                  <div className='w-px h-10 bg-border' />
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

              <div className='relative animate-scale-in delay-200'>
                <div className='aspect-square rounded-3xl overflow-hidden cute-shadow'>
                  <Image
                    src={heroImage}
                    alt='Bộ sưu tập Ghẹ Crochet'
                    width={600}
                    height={600}
                    className='object-cover w-full h-full hover:scale-105 transition-transform duration-700'
                    priority
                  />
                </div>
                <div className='absolute -top-4 -right-4 w-20 h-20 bg-accent rounded-full flex items-center justify-center cute-shadow animate-float'>
                  <Heart className='w-8 h-8 text-accent-foreground' />
                </div>
                <div className='absolute -bottom-3 -left-3 bg-white rounded-2xl p-3 cute-shadow flex items-center gap-2 animate-fade-in-up delay-500'>
                  <div className='w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center'>
                    <CheckCircle2 className='w-4 h-4 text-primary-foreground' />
                  </div>
                  <div>
                    <div className='text-xs font-semibold'>100% Handmade</div>
                    <div className='text-xs text-muted-foreground'>
                      Đảm bảo chất lượng
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Perks strip ──────────────────────────────── */}
        <section className='py-5 bg-white border-y border-border'>
          <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex flex-wrap items-center justify-center gap-x-10 gap-y-3'>
              {[
                { emoji: '🧶', label: '100% Handmade' },
                { emoji: '📦', label: 'Giao hàng toàn quốc' },
                { emoji: '🎨', label: 'Đặt theo yêu cầu' },
                { emoji: '💝', label: 'Quà tặng ý nghĩa' }
              ].map(({ emoji, label }) => (
                <div
                  key={label}
                  className='flex items-center gap-2 text-sm text-muted-foreground'
                >
                  <span className='text-lg'>{emoji}</span>
                  <span className='font-medium'>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Discounted Products ───────────────────────── */}
        {discountedProducts.length > 0 && (
          <section className='py-16 lg:py-24 bg-white'>
            <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
              <AnimatedSection>
                <div className='text-center space-y-4 mb-12'>
                  <Badge className='bg-primary text-primary-foreground'>
                    <Sparkles className='w-3 h-3 mr-1' />
                    Giảm giá đặc biệt
                  </Badge>
                  <h2 className='text-3xl lg:text-4xl font-bold'>
                    Ưu đãi không thể bỏ lỡ
                  </h2>
                  <p className='text-lg text-muted-foreground max-w-2xl mx-auto text-pretty'>
                    Những sản phẩm đang giảm giá hấp dẫn dành riêng cho bạn
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection
                className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
                stagger
              >
                {discountedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </AnimatedSection>

              <AnimatedSection className='text-center mt-12'>
                <Button
                  asChild
                  size='lg'
                  variant='outline'
                  className='rounded-full bg-transparent'
                >
                  <Link href='/products'>Xem tất cả khuyến mãi</Link>
                </Button>
              </AnimatedSection>
            </div>
          </section>
        )}

        {/* ── Featured Products ─────────────────────────── */}
        {/* <section className='py-16 lg:py-24 bg-muted/30'>
          <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
            <AnimatedSection>
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
            </AnimatedSection>

            <AnimatedSection
              className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'
              stagger
            >
              {featuredProducts?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </AnimatedSection>

            <AnimatedSection className='text-center mt-12'>
              <Button
                asChild
                size='lg'
                variant='outline'
                className='rounded-full bg-transparent'
              >
                <Link href='/products'>Xem tất cả sản phẩm</Link>
              </Button>
            </AnimatedSection>
          </div>
        </section> */}

        {/* ── Custom Order Hook ────────────────────────── */}
        <section className='py-16 lg:py-24 bg-red-50'>
          <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='grid lg:grid-cols-2 gap-12 lg:gap-20 items-center'>
              {/* Decorative side */}
              <AnimatedSection className='relative order-2 lg:order-1'>
                <div className='relative aspect-square max-w-md mx-auto'>
                  {/* Background blob */}
                  <div className='absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 rounded-3xl' />
                  {/* Main image */}
                  <div className='absolute inset-4 rounded-2xl overflow-hidden cute-shadow'>
                    <Image
                      src={customOrderImage}
                      alt='Sản phẩm đặt theo yêu cầu'
                      fill
                      className='object-cover'
                    />
                  </div>
                  {/* Floating chips */}
                  <div className='absolute -top-3 -right-3 bg-white rounded-full px-3 py-1.5 cute-shadow text-sm font-medium flex items-center gap-1.5 animate-float'>
                    <Palette className='w-3.5 h-3.5 text-accent-foreground' />
                    Chọn màu tự do
                  </div>
                  <div className='absolute -bottom-3 -left-3 bg-white rounded-full px-3 py-1.5 cute-shadow text-sm font-medium flex items-center gap-1.5 animate-float delay-300'>
                    <Ruler className='w-3.5 h-3.5 text-secondary-foreground' />
                    Tùy chỉnh kích thước
                  </div>
                </div>
              </AnimatedSection>

              {/* Text side */}
              <AnimatedSection className='space-y-6 order-1 lg:order-2'>
                <Badge className='bg-accent text-accent-foreground w-fit'>
                  <Tag className='w-3 h-3 mr-1' />
                  Đặt hàng riêng
                </Badge>

                <h2 className='text-3xl lg:text-4xl font-bold leading-tight'>
                  Muốn một sản phẩm{' '}
                  <span className='gradient-text'>chỉ dành cho bạn?</span>
                </h2>

                <p className='text-muted-foreground leading-relaxed'>
                  Ghẹ Crochet nhận đặt hàng theo yêu cầu — từ màu sắc, kích
                  thước, đến hình dáng và phụ kiện đính kèm. Mỗi sản phẩm là một
                  tác phẩm độc nhất được tạo ra riêng cho bạn.
                </p>

                <ul className='space-y-3'>
                  {[
                    'Tự chọn màu sắc từ bảng màu phong phú',
                    'Điều chỉnh kích thước theo ý muốn',
                    'Thêm tên, ngày kỷ niệm hoặc hình riêng',
                    'Tư vấn mẫu thiết kế miễn phí'
                  ].map((item) => (
                    <li key={item} className='flex items-start gap-3 text-sm'>
                      <CheckCircle2 className='w-4 h-4 text-secondary-foreground mt-0.5 shrink-0' />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className='flex flex-col sm:flex-row gap-3 pt-2'>
                  <Button
                    asChild
                    size='lg'
                    className='bg-primary hover:bg-primary/90 text-primary-foreground rounded-full'
                  >
                    <Link href='/contact'>
                      <Heart className='w-4 h-4 mr-2' />
                      Liên hệ đặt ngay
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant='ghost'
                    size='lg'
                    className='rounded-full text-muted-foreground hover:text-foreground'
                  >
                    <Link href='/products'>
                      Xem mẫu có sẵn
                      <ArrowRight className='w-4 h-4 ml-2' />
                    </Link>
                  </Button>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────── */}
        {/* <section className='py-16 lg:py-24'>
          <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
            <AnimatedSection>
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
            </AnimatedSection>
          </div>
        </section> */}
      </main>

      <Footer />
    </div>
  )
}
