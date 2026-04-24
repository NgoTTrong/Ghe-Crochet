-- Add display_order field to categories for custom ordering
-- Lower values show first. Default 0 for new categories.

ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;

-- Backfill existing rows by created_at so current order is preserved.
-- Multiply by 10 to leave gaps for future manual inserts if needed.
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) * 10 AS rn
  FROM categories
  WHERE display_order = 0
)
UPDATE categories c
SET display_order = ordered.rn
FROM ordered
WHERE c.id = ordered.id;

CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
