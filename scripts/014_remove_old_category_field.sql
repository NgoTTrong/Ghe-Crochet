-- Remove the old category field from products table after migration
-- This should be run after confirming the junction table is working correctly

-- First, let's add a backup column temporarily (optional safety measure)
-- ALTER TABLE products ADD COLUMN category_backup TEXT;
-- UPDATE products SET category_backup = category;

-- Remove the old category field
ALTER TABLE products DROP COLUMN IF EXISTS category;

-- Add a comment to track this change
COMMENT ON TABLE products IS 'Products table updated to use many-to-many relationship with categories via product_categories junction table. Old category field removed.';
