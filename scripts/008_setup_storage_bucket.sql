-- Fixed SQL syntax by removing IF NOT EXISTS from CREATE POLICY statements
-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for public read access to product images
DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
CREATE POLICY "Public can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Policy for authenticated users to upload product images
DROP POLICY IF EXISTS "Authenticated can upload product images" ON storage.objects;
CREATE POLICY "Authenticated can upload product images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images');

-- Policy for authenticated users to delete product images
DROP POLICY IF EXISTS "Authenticated can delete product images" ON storage.objects;
CREATE POLICY "Authenticated can delete product images" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images');
