import { createClient } from '@/lib/supabase/server';
import { ProductForm } from '@/components/admin/product-form';
import { notFound } from 'next/navigation';

interface EditProductPageProps {
  params: { id: string };
}

export default async function EditProductPage({
  params,
}: EditProductPageProps) {
  const supabase = await createClient();

  const { data: productData, error } = await supabase
    .from('products')
    .select(
      `
    *,
    product_categories(
      categories(id, name)
    )
  `
    )
    .eq('id', params.id)
    .maybeSingle();

  console.log('🚀 ~ EditProductPage ~ error:', error);
  console.log('🚀 ~ EditProductPage ~ productData:', productData);

  if (error || !productData) {
    notFound();
  }

  const product = {
    ...productData,
    categories:
      productData.product_categories?.map((pc: any) => pc.categories) || [],
  };

  // Get all categories for the form
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  return (
    <div className='min-h-screen bg-background'>
      <main className='container mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='space-y-6'>
          <div>
            <h1 className='text-3xl font-bold'>Chỉnh sửa sản phẩm</h1>
            <p className='text-muted-foreground'>Cập nhật thông tin sản phẩm</p>
          </div>

          <ProductForm product={product} categories={categories || []} />
        </div>
      </main>
    </div>
  );
}
