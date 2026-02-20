-- Add icon field to categories table
-- Stores an emoji or short text representing the category visual

ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT NULL;

-- Example update to set default icons for existing categories (optional)
-- UPDATE categories SET icon = '🧶' WHERE name ILIKE '%len%' OR name ILIKE '%crochet%';
-- UPDATE categories SET icon = '🐱' WHERE name ILIKE '%thú%' OR name ILIKE '%animal%';
-- UPDATE categories SET icon = '🎀' WHERE name ILIKE '%phụ kiện%' OR name ILIKE '%accessory%';
-- UPDATE categories SET icon = '🏠' WHERE name ILIKE '%trang trí%' OR name ILIKE '%decor%';
-- UPDATE categories SET icon = '🎁' WHERE name ILIKE '%quà%' OR name ILIKE '%gift%';
