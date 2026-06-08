-- Timeline events: configurable "câu chuyện theo dòng thời gian" for the About page.
-- Each row is one milestone shown on the public /about timeline.
CREATE TABLE IF NOT EXISTS timeline_events (
  id            BIGSERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  -- Free-form date label, e.g. "2021", "Tháng 3/2023", "Mùa hè 2024".
  event_date    TEXT,
  -- Ordered list of image URLs (first = cover). One event can have many photos.
  image_urls    TEXT[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS timeline_events_order_idx
  ON timeline_events (display_order);

ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

-- Public can read active milestones (the /about page fetches without auth).
CREATE POLICY "Public read timeline_events" ON timeline_events
  FOR SELECT USING (true);

-- Writes go through the admin API (service-role key), which bypasses RLS.
CREATE POLICY "Authenticated users manage timeline_events" ON timeline_events
  FOR ALL USING (auth.role() = 'authenticated');
