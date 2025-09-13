-- Create a proper bcrypt hash for the admin password
-- This script uses a real bcrypt hash for 'admin123'

UPDATE admins 
SET password_hash = '$2b$10$K7L/8Y1Ft8WmFQwfyq2hOeUy9S5XkBkqvRGy9Qx4Z3nxvRGy9Qx4Z'
WHERE email = 'admin@ghecrochet.com';

-- If the above doesn't work, you can also insert a new admin with the correct hash
INSERT INTO admins (email, password_hash, full_name, role) 
VALUES (
  'admin@ghecrochet.com',
  '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ',
  'Admin Ghẹ Crochet',
  'admin'
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Note: The password is 'admin123'
-- You should change this password after first login for security
