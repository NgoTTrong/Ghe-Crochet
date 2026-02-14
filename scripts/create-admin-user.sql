-- Insert a test admin user
INSERT INTO admins (
  id,
  email,
  password_hash,
  full_name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@ghecrochet.com',
  'admin123',
  'Admin User',
  'admin',
  true,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  updated_at = now();
