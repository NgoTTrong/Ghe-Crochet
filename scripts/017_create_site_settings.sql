-- Site settings table: generic key-value store for configurable site content
CREATE TABLE IF NOT EXISTS site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read (home page fetches these without auth)
CREATE POLICY "Public read site_settings" ON site_settings
  FOR SELECT USING (true);

-- Only authenticated users can write
CREATE POLICY "Authenticated users manage site_settings" ON site_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Seed the two home-page image slots (null = not set yet)
INSERT INTO site_settings (key, value) VALUES
  ('home_hero_image',         NULL),
  ('home_custom_order_image', NULL)
ON CONFLICT (key) DO NOTHING;
