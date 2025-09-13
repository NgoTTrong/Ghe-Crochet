-- Create products table for Ghẹ Crochet showcase
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  category TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  materials TEXT,
  size_info TEXT,
  care_instructions TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read access for showcase (no authentication needed for viewing)
CREATE POLICY "Allow public read access to products" ON products 
  FOR SELECT USING (true);

-- Only authenticated users can modify products (for admin)
CREATE POLICY "Allow authenticated users to insert products" ON products 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update products" ON products 
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete products" ON products 
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to categories
CREATE POLICY "Allow public read access to categories" ON categories 
  FOR SELECT USING (true);

-- Only authenticated users can modify categories
CREATE POLICY "Allow authenticated users to manage categories" ON categories 
  FOR ALL USING (auth.uid() IS NOT NULL);
