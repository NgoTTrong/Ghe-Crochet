-- Upgrade timeline_events to support MANY images per event.
-- Safe to run whether or not 019 was applied with the old single-image column.

-- 1. Add the new array column if it does not exist.
ALTER TABLE timeline_events
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] NOT NULL DEFAULT '{}';

-- 2. Backfill the array from the old single-image column, if that column exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'timeline_events' AND column_name = 'image_url'
  ) THEN
    UPDATE timeline_events
      SET image_urls = ARRAY[image_url]
      WHERE image_url IS NOT NULL
        AND image_url <> ''
        AND (image_urls IS NULL OR array_length(image_urls, 1) IS NULL);

    ALTER TABLE timeline_events DROP COLUMN image_url;
  END IF;
END $$;
