-- Simple admin setup with plain text password for testing
-- This will be replaced with proper bcrypt hashing later

-- Clear existing admin data
DELETE FROM admin_sessions;
DELETE FROM admins;

-- Insert admin with simple password for testing
INSERT INTO admins (email, password_hash, full_name, role, is_active) 
VALUES (
  'admin@ghecrochet.com',
  'admin123', -- This is temporary - will be replaced with bcrypt hash
  'Admin Ghẹ Crochet',
  'admin',
  true
);
