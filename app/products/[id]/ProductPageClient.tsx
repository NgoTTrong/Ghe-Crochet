'use client'

import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { ImagePopup } from '@/components/image-popup'
import { ProductCard } from '@/components/product-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Package,
  Share2,
  Shield,
  Star,
  Truck
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProductPageProps {
  params: { id: string }
}

export default function ProductPageClient({ params }: ProductPageProps) {
  const [product, setProduct] = useState<any>(null)
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const { id } = params

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(
            `
            *,
            product_categories!inner(
              categories(
                id,
                name,
                description
              )
            )
          `
          )
          .eq('id', id)
          .single()

        if (productError || !productData) {
          notFound()
          return
        }

        const transformedProduct = {
          ...productData,
          categories:
            productData.product_categories?.map((pc: any) => pc.categories) ||
            []
        }

        setProduct(transformedProduct)

        if (transformedProduct.categories.length > 0) {
          const categoryIds = transformedProduct.categories.map(
            (cat: any) => cat.id
          )

          const { data: relatedProductsData } = await supabase
            .from('products')
            .select(
              `
              *,
              product_categories!inner(
                categories(
                  id,
                  name,
                  description
                )
              )
            `
            )
            .in('product_categories.category_id', categoryIds)
            .eq('is_available', true)
            .neq('id', id)
            .order('created_at', { ascending: false })
            .limit(4)

          const transformedRelatedProducts =
            relatedProductsData?.map((product: any) => ({
              ...product,
              categories:
                product.product_categories?.map((pc: any) => pc.categories) ||
                []
            })) || []

          setRelatedProducts(transformedRelatedProducts)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        notFound()
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, supabase])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!product) {
    return <div>Product not found</div>
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'VND',
      availability: product.is_available
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Ghẹ Crochet'
      }
    },
    brand: {
      '@type': 'Brand',
      name: 'Ghẹ Crochet'
    },
    category: product.categories?.[0]?.name || 'Handmade',
    material: product.materials,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      reviewCount: '1'
    }
  }

  return (
    <div className='min-h-screen'>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Header />

      <main className='py-8'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Breadcrumb */}
          <div className='flex items-center gap-2 text-sm text-muted-foreground mb-8'>
            <Link href='/' className='hover:text-primary transition-colors'>
              Trang chủ
            </Link>
            <span>/</span>
            <Link
              href='/products'
              className='hover:text-primary transition-colors'
            >
              Sản phẩm
            </Link>
            <span>/</span>
            <span className='text-foreground'>{product.name}</span>
          </div>

          {/* Back Button */}
          <Button variant='ghost' size='sm' className='mb-6' asChild>
            <Link href='/products'>
              <ArrowLeft className='w-4 h-4 mr-2' />
              Quay lại danh sách
            </Link>
          </Button>

          {/* Product Details */}
          <div className='grid lg:grid-cols-2 gap-12 mb-16'>
            {/* Product Images */}
            <ProductImageGallery
              images={product.images || []}
              productName={product.name}
            />

            {/* Product Info */}
            <div className='space-y-6'>
              <div className='space-y-4'>
                <div className='flex items-start justify-between gap-4'>
                  <div className='space-y-2'>
                    <h1 className='text-3xl lg:text-4xl font-bold text-balance text-gray-900'>
                      {product.name}
                    </h1>
                    <div className='flex items-center gap-2 flex-wrap'>
                      {product.categories?.map((category: any) => (
                        <Badge
                          key={category.id}
                          variant='outline'
                          className='text-gray-700 border-gray-300'
                        >
                          {category.name}
                        </Badge>
                      ))}
                      {product.is_featured && (
                        <Badge className='bg-pink-100 text-pink-800 border-pink-200'>
                          <Star className='w-3 h-3 mr-1' />
                          Nổi bật
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className='flex items-center gap-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-gray-600 hover:text-pink-600'
                    >
                      <Heart className='w-4 h-4' />
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-gray-600 hover:text-pink-600'
                    >
                      <Share2 className='w-4 h-4' />
                    </Button>
                  </div>
                </div>

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

                <p className='text-lg text-gray-600 leading-relaxed'>
                  {product.description}
                </p>
              </div>

              <Separator />

              {/* Product Details */}
              <div className='space-y-4'>
                <h3 className='font-semibold text-lg text-gray-900'>
                  Thông tin sản phẩm
                </h3>
                <div className='grid gap-3'>
                  {product.materials && (
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Chất liệu:</span>
                      <span className='font-medium text-gray-900'>
                        {product.materials}
                      </span>
                    </div>
                  )}
                  {product.size_info && (
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Kích thước:</span>
                      <span className='font-medium text-gray-900'>
                        {product.size_info}
                      </span>
                    </div>
                  )}
                  {product.care_instructions && (
                    <div className='flex justify-between'>
                      <span className='text-gray-600'>Hướng dẫn bảo quản:</span>
                      <span className='font-medium text-gray-900'>
                        {product.care_instructions}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className='space-y-4'>
                <Button
                  size='lg'
                  className='w-full bg-pink-600 hover:bg-pink-700 text-white rounded-full'
                  asChild
                >
                  <Link href='/contact'>
                    <MessageCircle className='w-4 h-4 mr-2' />
                    Liên hệ đặt hàng
                  </Link>
                </Button>

                <div className='grid grid-cols-3 gap-4 text-center'>
                  <div className='space-y-2'>
                    <div className='w-12 h-12 mx-auto rounded-full bg-pink-100 flex items-center justify-center'>
                      <Package className='w-6 h-6 text-pink-600' />
                    </div>
                    <div className='text-xs text-gray-600'>Handmade</div>
                  </div>
                  <div className='space-y-2'>
                    <div className='w-12 h-12 mx-auto rounded-full bg-blue-100 flex items-center justify-center'>
                      <Truck className='w-6 h-6 text-blue-600' />
                    </div>
                    <div className='text-xs text-gray-600'>
                      Giao hàng toàn quốc
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <div className='w-12 h-12 mx-auto rounded-full bg-green-100 flex items-center justify-center'>
                      <Shield className='w-6 h-6 text-green-600' />
                    </div>
                    <div className='text-xs text-gray-600'>
                      Bảo hành chất lượng
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Product Description */}
          <section className='mb-16'>
            <div className='bg-white rounded-2xl shadow-sm border p-8 lg:p-12'>
              <div className='max-w-4xl mx-auto'>
                <div className='text-center mb-8'>
                  <h2 className='text-2xl lg:text-3xl font-bold text-gray-900 mb-4'>
                    Mô tả chi tiết sản phẩm
                  </h2>
                  <p className='text-gray-600'>
                    Tìm hiểu thêm về sản phẩm handmade đặc biệt này
                  </p>
                </div>

                <div className='prose prose-lg max-w-none'>
                  <div className='grid lg:grid-cols-2 gap-8 items-start'>
                    <div className='space-y-6'>
                      <div>
                        <h3 className='text-xl font-semibold text-gray-900 mb-3'>
                          Đặc điểm nổi bật
                        </h3>
                        <ul className='space-y-2 text-gray-700'>
                          <li className='flex items-start gap-2'>
                            <span className='w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0'></span>
                            <span>
                              Được đan thủ công 100% bằng tay với kỹ thuật
                              crochet truyền thống
                            </span>
                          </li>
                          <li className='flex items-start gap-2'>
                            <span className='w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0'></span>
                            <span>
                              Sử dụng chỉ cotton cao cấp, mềm mại và an toàn cho
                              da
                            </span>
                          </li>
                          <li className='flex items-start gap-2'>
                            <span className='w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0'></span>
                            <span>
                              Thiết kế độc đáo, không trùng lặp với bất kỳ sản
                              phẩm nào khác
                            </span>
                          </li>
                          <li className='flex items-start gap-2'>
                            <span className='w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0'></span>
                            <span>
                              Có thể tùy chỉnh màu sắc và kích thước theo yêu
                              cầu
                            </span>
                          </li>
                        </ul>
                      </div>

                      <div>
                        <h3 className='text-xl font-semibold text-gray-900 mb-3'>
                          Quy trình sản xuất
                        </h3>
                        <p className='text-gray-700 leading-relaxed'>
                          Mỗi sản phẩm được tạo ra qua quy trình tỉ mỉ, từ việc
                          lựa chọn nguyên liệu, thiết kế mẫu, đến từng mũi đan
                          cuối cùng. Chúng tôi cam kết mang đến những sản phẩm
                          chất lượng cao với sự tận tâm và yêu thương trong từng
                          chi tiết.
                        </p>
                      </div>
                    </div>

                    <div className='space-y-4'>
                      <div className='aspect-video rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-transform'>
                        <Image
                          src='/crochet-making-process.jpg'
                          alt='Quy trình làm crochet'
                          width={400}
                          height={300}
                          className='object-cover w-full h-full'
                        />
                      </div>
                      <p className='text-sm text-gray-500 text-center'>
                        Quy trình đan crochet thủ công tại xưởng Ghẹ Crochet
                      </p>
                    </div>
                  </div>

                  <Separator className='my-8' />

                  <div className='grid md:grid-cols-3 gap-6 text-center'>
                    <div className='space-y-3'>
                      <div className='w-16 h-16 mx-auto rounded-full bg-pink-100 flex items-center justify-center'>
                        <Heart className='w-8 h-8 text-pink-600' />
                      </div>
                      <h4 className='font-semibold text-gray-900'>
                        Làm bằng tình yêu
                      </h4>
                      <p className='text-sm text-gray-600'>
                        Mỗi sản phẩm được tạo ra với tình yêu và sự tận tâm của
                        người thợ thủ công
                      </p>
                    </div>
                    <div className='space-y-3'>
                      <div className='w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center'>
                        <Shield className='w-8 h-8 text-green-600' />
                      </div>
                      <h4 className='font-semibold text-gray-900'>
                        Chất lượng đảm bảo
                      </h4>
                      <p className='text-sm text-gray-600'>
                        Cam kết chất lượng cao với chế độ bảo hành và hỗ trợ
                        khách hàng tận tình
                      </p>
                    </div>
                    <div className='space-y-3'>
                      <div className='w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center'>
                        <Package className='w-8 h-8 text-blue-600' />
                      </div>
                      <h4 className='font-semibold text-gray-900'>
                        Đóng gói cẩn thận
                      </h4>
                      <p className='text-sm text-gray-600'>
                        Sản phẩm được đóng gói cẩn thận và giao hàng an toàn đến
                        tay khách hàng
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Related Products */}
          {relatedProducts && relatedProducts.length > 0 && (
            <section className='py-12'>
              <div className='space-y-8'>
                <div className='text-center space-y-4'>
                  <h2 className='text-2xl lg:text-3xl font-bold text-gray-900'>
                    Sản phẩm liên quan
                  </h2>
                  <p className='text-gray-600'>
                    Các sản phẩm khác trong cùng danh mục
                  </p>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                  {relatedProducts.map((relatedProduct: any) => (
                    <ProductCard
                      key={relatedProduct.id}
                      product={relatedProduct}
                    />
                  ))}
                </div>

                <div className='text-center'>
                  <Button
                    asChild
                    variant='outline'
                    className='rounded-full bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50'
                  >
                    <Link
                      href={`/products?category=${
                        product.categories?.[0]?.name?.toLowerCase() || ''
                      }`}
                    >
                      Xem thêm trong{' '}
                      {product.categories?.[0]?.name || 'danh mục này'}
                    </Link>
                  </Button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

function ProductImageGallery({
  images,
  productName
}: {
  images: string[]
  productName: string
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  )

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index)
  }

  const closePopup = () => {
    setSelectedImageIndex(null)
  }

  const validImages = images.filter((img) => img && img.trim() !== '')
  const displayImages =
    validImages.length > 0
      ? validImages
      : ['/placeholder.svg?height=600&width=600']

  return (
    <>
      <div className='space-y-4'>
        <div className='aspect-square rounded-2xl overflow-hidden cute-shadow cursor-pointer hover:scale-105 transition-transform'>
          <Image
            src={displayImages[0] || '/placeholder.svg'}
            alt={productName}
            width={600}
            height={600}
            className='object-cover w-full h-full'
            priority
            onClick={() => handleImageClick(0)}
          />
        </div>

        {/* Additional images if available */}
        {displayImages.length > 1 && (
          <div className='grid grid-cols-4 gap-2'>
            {displayImages.slice(1, 5).map((image, index) => (
              <div
                key={index}
                className='aspect-square rounded-lg overflow-hidden border cursor-pointer hover:scale-105 transition-transform'
                onClick={() => handleImageClick(index + 1)}
              >
                <Image
                  src={image || '/placeholder.svg'}
                  alt={`${productName} ${index + 2}`}
                  width={150}
                  height={150}
                  className='object-cover w-full h-full'
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedImageIndex !== null && (
        <ImagePopup
          images={displayImages}
          currentIndex={selectedImageIndex}
          onClose={closePopup}
        />
      )}
    </>
  )
}
