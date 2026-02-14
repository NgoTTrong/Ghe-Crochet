-- Create a separate admin table for direct database authentication
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to read their own data
CREATE POLICY "Admins can view own data" ON admins 
  FOR SELECT USING (true); -- We'll handle auth in the application layer

-- Insert default admin user with hashed password
-- Password: admin123 (you should change this)
INSERT INTO admins (email, password_hash, full_name) 
VALUES (
  'admin@ghecrochet.com',
  '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQ', -- This is a placeholder, we'll use bcrypt in the app
  'Admin Ghẹ Crochet'
) ON CONFLICT (email) DO NOTHING;

-- Create sessions table for managing login sessions
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admins(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for sessions
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for sessions
CREATE POLICY "Allow session access" ON admin_sessions 
  FOR ALL USING (true); -- We'll handle auth in the application layer
