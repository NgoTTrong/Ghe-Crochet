-- Create many-to-many relationship between products and categories
-- This script creates a junction table to allow products to have multiple categories

-- First, create the junction table
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, category_id)
);

-- Enable RLS for security
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access for showcase
CREATE POLICY "Allow public read access to product_categories" ON product_categories 
  FOR SELECT USING (true);

-- Only authenticated users can modify product_categories
CREATE POLICY "Allow authenticated users to manage product_categories" ON product_categories 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX idx_product_categories_product_id ON product_categories(product_id);
CREATE INDEX idx_product_categories_category_id ON product_categories(category_id);

-- Migrate existing data from products.category to the junction table
-- First, ensure all categories exist in the categories table
INSERT INTO categories (name, description)
SELECT DISTINCT 
  p.category as name,
  'Migrated from existing products' as description
FROM products p
WHERE p.category IS NOT NULL 
  AND p.category != ''
  AND NOT EXISTS (
    SELECT 1 FROM categories c WHERE c.name = p.category
  );

-- Now populate the junction table with existing product-category relationships
INSERT INTO product_categories (product_id, category_id)
SELECT DISTINCT 
  p.id as product_id,
  c.id as category_id
FROM products p
JOIN categories c ON c.name = p.category
WHERE p.category IS NOT NULL AND p.category != '';

-- Add a comment to track the migration
COMMENT ON TABLE product_categories IS 'Junction table for many-to-many relationship between products and categories. Created to replace the single category field in products table.';
