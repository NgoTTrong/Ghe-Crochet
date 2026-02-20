import type { Metadata } from 'next'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { Search } from 'lucide-react'
import { Suspense } from 'react'
import { FilterSidebar } from './components/filter-sidebar'
import { Pagination } from './components/pagination'

const PAGE_SIZE = 12

interface SearchParams {
  category?: string
  search?: string
  page?: string
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const params = await searchParams
  const category = params.category ? decodeURIComponent(params.category) : null
  const search = params.search ? decodeURIComponent(params.search) : null

  const title = category
    ? `${category} - Sản phẩm Ghẹ Crochet`
    : search
    ? `Tìm kiếm "${search}" - Ghẹ Crochet`
    : 'Tất cả sản phẩm - Ghẹ Crochet'

  const description = category
    ? `Khám phá các sản phẩm ${category} handmade tại Ghẹ Crochet. Chất lượng cao, làm bằng tay với tình yêu.`
    : 'Khám phá bộ sưu tập sản phẩm đan móc handmade tại Ghẹ Crochet. Từ thú bông amigurumi đến phụ kiện thời trang, tất cả đều được làm thủ công với tình yêu.'

  return {
    title,
    description,
    keywords: `crochet, handmade, đan móc, thủ công, ${category || 'amigurumi, len, búp bê, thú bông'}`,
    openGraph: { title, description, type: 'website', siteName: 'Ghẹ Crochet' },
    alternates: {
      canonical: category
        ? `/products?category=${encodeURIComponent(category)}`
        : '/products',
    },
  }
}

export default async function ProductsPage({
  searchParams,
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
  const currentPage = Math.max(1, parseInt(params.page || '1'))
  const offset = (currentPage - 1) * PAGE_SIZE

  let products: any[] = []
  let totalCount = 0
  let categories: any[] = []

  try {
    const selectStr = decodedCategory
      ? `*, product_categories!inner(categories!inner(id, name, description))`
      : `*, product_categories(categories(id, name, description))`

    let productsQuery = supabase
      .from('products')
      .select(selectStr, { count: 'exact' })
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (decodedCategory) {
      productsQuery = productsQuery.eq(
        'product_categories.categories.name',
        decodedCategory
      )
    }
    if (decodedSearch) {
      productsQuery = productsQuery.or(
        `name.ilike.%${decodedSearch}%,description.ilike.%${decodedSearch}%`
      )
    }

    const { data: productsData, count, error } = await productsQuery
    if (!error) {
      totalCount = count || 0
      products = (productsData || []).map((p) => ({
        ...p,
        categories: p.product_categories.map((pc: any) => pc.categories),
      }))
    }

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name')

    categories = categoriesData || []
  } catch (err) {
    console.error('[products] error:', err)
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const paginationParams = new URLSearchParams()
  if (decodedCategory) paginationParams.set('category', decodedCategory)
  if (decodedSearch) paginationParams.set('search', decodedSearch)
  const basePath = `/products?${paginationParams.toString()}`

  return (
    <div className='min-h-screen'>
      <Header />

      <main className='py-8 lg:py-12'>
        <div className='container mx-auto px-4 sm:px-6 lg:px-8'>

          {/* Page heading */}
          <div className='mb-8'>
            <h1 className='text-2xl lg:text-3xl font-bold'>Bộ sưu tập</h1>
            <p className='text-muted-foreground mt-1'>
              {totalCount} sản phẩm
              {decodedCategory && (
                <> trong <span className='font-medium text-foreground'>{decodedCategory}</span></>
              )}
              {decodedSearch && (
                <> cho <span className='font-medium text-foreground'>"{decodedSearch}"</span></>
              )}
            </p>
          </div>

          {/* Sidebar + Content */}
          <div className='flex flex-col lg:flex-row gap-8'>

            {/* ── Left: Filters ───────────────────────── */}
            <Suspense fallback={null}>
              <FilterSidebar
                categories={categories}
                activeCategory={decodedCategory}
                activeSearch={decodedSearch}
                totalCount={totalCount}
              />
            </Suspense>

            {/* ── Right: Products ──────────────────────── */}
            <div className='flex-1 min-w-0'>
              <Suspense fallback={
                <div className='grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6'>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className='aspect-square rounded-2xl bg-muted animate-pulse' />
                  ))}
                </div>
              }>
                {products.length > 0 ? (
                  <>
                    <div className='grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6'>
                      {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>

                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      basePath={basePath}
                    />
                  </>
                ) : (
                  <div className='flex flex-col items-center justify-center py-24 text-center gap-4'>
                    <div className='w-16 h-16 rounded-full bg-muted flex items-center justify-center'>
                      <Search className='w-7 h-7 text-muted-foreground' />
                    </div>
                    <div>
                      <p className='font-semibold'>Không tìm thấy sản phẩm</p>
                      <p className='text-sm text-muted-foreground mt-1'>
                        Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm
                      </p>
                    </div>
                    <Button asChild variant='outline' className='rounded-full'>
                      <a href='/products'>Xem tất cả sản phẩm</a>
                    </Button>
                  </div>
                )}
              </Suspense>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
