import { createClient } from './client';

export interface ProductWithCategories {
  id: string;
  name: string;
  description: string;
  price: number;
  materials: string | null;
  size_info: string | null;
  care_instructions: string | null;
  is_featured: boolean;
  is_available: boolean;
  images: string[];
  created_at: string;
  updated_at: string;
  categories: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

// Get all products with their categories
export async function getProductsWithCategories(): Promise<
  ProductWithCategories[]
> {
  const supabase = createClient();

  const { data, error } = await supabase
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
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products with categories:', error);
    throw error;
  }

  // Transform the data to flatten categories
  return data.map((product) => ({
    ...product,
    categories: product.product_categories.map((pc: any) => pc.categories),
  }));
}

// Get a single product with its categories
export async function getProductWithCategories(
  productId: string
): Promise<ProductWithCategories | null> {
  const supabase = createClient();

  const { data, error } = await supabase
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
    .eq('id', productId)
    .single();

  if (error) {
    console.error('Error fetching product with categories:', error);
    return null;
  }

  return {
    ...data,
    categories: data.product_categories.map((pc: any) => pc.categories),
  };
}

// Get products by category
export async function getProductsByCategory(
  categoryId: string
): Promise<ProductWithCategories[]> {
  const supabase = createClient();

  const { data, error } = await supabase
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
    .eq('product_categories.category_id', categoryId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }

  return data.map((product) => ({
    ...product,
    categories: product.product_categories.map((pc: any) => pc.categories),
  }));
}

// Add categories to a product
export async function addCategoriesToProduct(
  productId: string,
  categoryIds: string[]
): Promise<void> {
  const supabase = createClient();

  const insertData = categoryIds.map((categoryId) => ({
    product_id: productId,
    category_id: categoryId,
  }));

  const { error } = await supabase
    .from('product_categories')
    .insert(insertData);

  if (error) {
    console.error('Error adding categories to product:', error);
    throw error;
  }
}

// Remove categories from a product
export async function removeCategoriesFromProduct(
  productId: string,
  categoryIds?: string[]
): Promise<void> {
  const supabase = createClient();

  let query = supabase
    .from('product_categories')
    .delete()
    .eq('product_id', productId);

  if (categoryIds && categoryIds.length > 0) {
    query = query.in('category_id', categoryIds);
  }

  const { error } = await query;

  if (error) {
    console.error('Error removing categories from product:', error);
    throw error;
  }
}

// Update product categories (replace all existing categories)
export async function updateProductCategories(
  productId: string,
  categoryIds: string[]
): Promise<void> {
  const supabase = createClient();

  // Remove all existing categories for this product
  await removeCategoriesFromProduct(productId);

  // Add new categories if any
  if (categoryIds.length > 0) {
    await addCategoriesToProduct(productId, categoryIds);
  }
}

// Get all categories
export async function getAllCategories(): Promise<Category[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return data || [];
}
