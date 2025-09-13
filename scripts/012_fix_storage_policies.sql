-- Fix Supabase Storage RLS policies for about-images bucket

-- Create the bucket if it doesn't exist (public bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'about-images',
  'about-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Allow public uploads to the about-images bucket
CREATE POLICY "Allow public uploads to about-images bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'about-images');

-- Allow public access to view files in about-images bucket
CREATE POLICY "Allow public access to about-images bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'about-images');

-- Allow public updates to about-images bucket (for overwriting files)
CREATE POLICY "Allow public updates to about-images bucket"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'about-images')
WITH CHECK (bucket_id = 'about-images');

-- Allow public deletes from about-images bucket
CREATE POLICY "Allow public deletes from about-images bucket"
ON storage.objects
FOR DELETE
USING (bucket_id = 'about-images');
