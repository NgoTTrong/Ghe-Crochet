import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { Search } from 'lucide-react'
import { Suspense } from 'react'
import { ProductSearch } from './components/product-search'

interface SearchParams {
  category?: string
  search?: string
}

export default async function ProductsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const decodedCategory = params.category
    ? decodeURIComponent(params.category)
    : undefined
  const decodedSearch = params.search
    ? decodeURIComponent(params.search)
    : undefined

  let products = []
  let categories = []

  try {
    let productsQuery = supabase
      .from('products')
      .select(
        `
        *,
        product_categories(
          categories(
            id,
            name,
            description
          )
        )
      `
      )
      .eq('is_available', true)
      .order('created_at', { ascending: false })

    if (decodedCategory) {
      // Use inner join to filter products that have the specific category
      productsQuery = supabase
        .from('products')
        .select(
          `
          *,
          product_categories!inner(
            categories!inner(
              id,
              name,
              description
            )
          )
        `
        )
        .eq('is_available', true)
        .eq('product_categories.categories.name', decodedCategory)
        .order('created_at', { ascending: false })
    }

    if (decodedSearch) {
      productsQuery = productsQuery.or(
        `name.ilike.%${decodedSearch}%,description.ilike.%${decodedSearch}%`
      )
    }

    const { data: productsData, error: productsError } = await productsQuery

    if (productsError) {
      console.error('[v0] Products query error:', productsError)
    } else {
      products = (productsData || []).map((product) => ({
        ...product,
        categories: product.product_categories.map((pc: any) => pc.categories)
      }))
    }

    // Get categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    if (categoriesError) {
      console.error('[v0] Categories query error:', categoriesError)
    } else {
      categories = categoriesData || []
    }
  } catch (error) {
    console.error('[v0] Database connection error:', error)
  }

  return (
    <div className='min-h-screen'>
      <Header />

      <main className='py-8'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
          {/* Page Header */}
          <div className='text-center space-y-4 mb-12'>
            <h1 className='text-3xl lg:text-4xl font-bold'>
              Bộ sưu tập sản phẩm
            </h1>
            <p className='text-lg text-muted-foreground max-w-2xl mx-auto text-pretty'>
              Khám phá những sản phẩm handmade độc đáo được tạo ra với tình yêu
            </p>
          </div>

          {/* Filters */}
          <div className='mb-8'>
            <Card className='border-0 cute-shadow'>
              <CardContent className='p-6'>
                <div className='flex flex-col gap-4 justify-between'>
                  {/* Search + Count */}
                  <div className='flex items-center gap-4'>
                    <span className='text-sm text-muted-foreground whitespace-nowrap'>
                      {products.length} sản phẩm
                    </span>
                    <ProductSearch category={decodedCategory} />
                  </div>

                  {/* Categories */}
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      variant={!decodedCategory ? 'default' : 'outline'}
                      size='sm'
                      className='rounded-full'
                      asChild
                    >
                      <a href='/products'>Tất cả</a>
                    </Button>

                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={
                          decodedCategory === category.name
                            ? 'default'
                            : 'outline'
                        }
                        size='sm'
                        className='rounded-full'
                        asChild
                      >
                        <a
                          href={`/products?category=${encodeURIComponent(category.name)}`}
                        >
                          {category.name}
                        </a>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <Suspense fallback={<div>Đang tải...</div>}>
            {products && products.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className='text-center py-12'>
                <div className='space-y-4'>
                  <div className='w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center'>
                    <Search className='w-8 h-8 text-muted-foreground' />
                  </div>
                  <h3 className='text-lg font-semibold'>
                    Không tìm thấy sản phẩm
                  </h3>
                  <p className='text-muted-foreground'>
                    Thử thay đổi bộ lọc hoặc tìm kiếm khác
                  </p>
                  <Button
                    asChild
                    variant='outline'
                    className='rounded-full bg-transparent'
                  >
                    <a href='/products'>Xem tất cả sản phẩm</a>
                  </Button>
                </div>
              </div>
            )}
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  )
}
