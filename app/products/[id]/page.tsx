import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import ProductPageClient from './ProductPageClient';

function createSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = createSupabaseClient();

  const { data: product } = await supabase
    .from('products')
    .select('name, description, images, price')
    .eq('id', id)
    .single();

  if (!product) {
    return {
      title: 'Sản phẩm không tìm thấy - Ghẹ Crochet',
      description: 'Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.',
    };
  }

  const title = `${product.name} - Ghẹ Crochet`;
  const description =
    product.description ||
    `Mua ${
      product.name
    } handmade chất lượng cao tại Ghẹ Crochet. Giá ${new Intl.NumberFormat(
      'vi-VN',
      { style: 'currency', currency: 'VND' }
    ).format(product.price)}`;
  const image = product.images?.[0] || '/placeholder.svg';

  return {
    title,
    description,
    keywords: `crochet, handmade, ${product.name}, đan móc, thủ công`,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image,
          width: 600,
          height: 600,
          alt: product.name,
        },
      ],
      type: 'website',
      siteName: 'Ghẹ Crochet',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: `/products/${id}`,
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  return <ProductPageClient params={await params} />;
}
