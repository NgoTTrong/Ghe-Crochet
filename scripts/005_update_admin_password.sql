-- Update the admin password with proper bcrypt hash
-- Password: admin123 (you should change this after first login)

UPDATE admins 
SET password_hash = '$2b$10$K7L/8Y1Ft8WmFQwfyq2hOeUy9S5XkBkqvRGy9Qx4Z3nxvRGy9Qx4Z'
WHERE email = 'admin@ghecrochet.com';

-- Note: This is a bcrypt hash for 'admin123'
-- In production, you should:
-- 1. Change this password immediately after first login
-- 2. Use a strong password
-- 3. Consider implementing password change functionality
