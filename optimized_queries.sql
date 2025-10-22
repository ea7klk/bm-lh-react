-- Optimized Queries for BM Last Heard Application

-- 1. OPTIMIZED: Get Last Heard with count in single query
-- Replace the separate COUNT query with window function
-- BEFORE: Two separate queries (SELECT + COUNT)
-- AFTER: Single query with window function

WITH filtered_data AS (
  SELECT 
    lh.*, 
    tg.continent, 
    tg.country, 
    tg.full_country_name,
    tg.name as talkgroup_name,
    COUNT(*) OVER() as total_count,
    ROW_NUMBER() OVER (ORDER BY lh."Start" DESC) as row_num
  FROM lastheard lh
  LEFT JOIN talkgroups tg ON lh."DestinationID" = tg.talkgroup_id
  WHERE 
    -- Time filter example: last 60 minutes
    lh."Start" >= EXTRACT(EPOCH FROM NOW()) - (60 * 60)
    -- Add other filters as needed: continent, country, etc.
)
SELECT *
FROM filtered_data
WHERE row_num <= 50 -- LIMIT
  AND row_num > 0; -- OFFSET equivalent

-- 2. OPTIMIZED: Talkgroup Stats Query
-- Use the summary table when available, fall back to raw data for recent activity

SELECT 
  COALESCE(
    -- Try summary table first for older data
    (SELECT destination_id FROM lastheard_hourly_summary 
     WHERE hour_start >= $1 AND hour_end <= $2 
     GROUP BY destination_id 
     HAVING SUM(total_calls) > 0 
     LIMIT 1), 
    -- Fall back to raw data for recent activity
    lh."DestinationID"
  ) as talkgroup_id,
  COALESCE(tg.name, lh."DestinationName", 'Unknown') as name,
  COUNT(*) as count,
  tg.continent,
  tg.country,
  tg.full_country_name
FROM lastheard lh
LEFT JOIN talkgroups tg ON lh."DestinationID" = tg.talkgroup_id
WHERE lh."Start" >= EXTRACT(EPOCH FROM NOW()) - (60 * 60) -- Last hour only
GROUP BY lh."DestinationID", tg.name, lh."DestinationName", tg.continent, tg.country, tg.full_country_name
ORDER BY count DESC
LIMIT 20;

-- 3. OPTIMIZED: Poll New Entries
-- Use created_at index more effectively

SELECT 
  lh.*, 
  tg.continent, 
  tg.country, 
  tg.full_country_name,
  tg.name as talkgroup_name
FROM lastheard lh
LEFT JOIN talkgroups tg ON lh."DestinationID" = tg.talkgroup_id
WHERE 
  lh.created_at > $1 -- Use created_at for polling
  AND lh."Start" >= EXTRACT(EPOCH FROM NOW()) - ($2 * 60) -- Time filter
  -- Add other filters...
ORDER BY lh.created_at DESC, lh."Start" DESC 
LIMIT 100;

-- 4. OPTIMIZED: Duration Stats Query
-- Pre-filter null durations and use better aggregation

SELECT 
  lh."DestinationID" as talkgroup_id,
  COALESCE(tg.name, lh."DestinationName", 'Unknown') as name,
  SUM(lh.duration) as total_duration,
  COUNT(*) as call_count,
  AVG(lh.duration) as avg_duration,
  tg.continent,
  tg.country,
  tg.full_country_name
FROM lastheard lh
LEFT JOIN talkgroups tg ON lh."DestinationID" = tg.talkgroup_id
WHERE 
  lh.duration IS NOT NULL 
  AND lh.duration > 0
  AND lh."Start" >= EXTRACT(EPOCH FROM NOW()) - (60 * 60) -- Time filter
GROUP BY lh."DestinationID", tg.name, lh."DestinationName", tg.continent, tg.country, tg.full_country_name
HAVING SUM(lh.duration) > 0 -- Only groups with actual duration
ORDER BY total_duration DESC
LIMIT 20;

-- 5. MATERIALIZED VIEW: Daily Statistics (Refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_lastheard_stats AS
SELECT 
  DATE_TRUNC('day', to_timestamp("Start")) as day,
  "DestinationID",
  COUNT(*) as total_calls,
  SUM(COALESCE(duration, 0)) as total_duration,
  AVG(COALESCE(duration, 0)) as avg_duration,
  COUNT(DISTINCT "SourceCall") as unique_callsigns
FROM lastheard 
WHERE "Start" > 0
GROUP BY DATE_TRUNC('day', to_timestamp("Start")), "DestinationID";

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_daily_stats_day_dest ON daily_lastheard_stats(day, "DestinationID");

-- 6. EXPLAIN ANALYZE examples to monitor performance
-- Run these to check query performance:

-- EXPLAIN (ANALYZE, BUFFERS) 
-- SELECT ... your query here ...

-- 7. Maintenance queries to run periodically
-- Run these during low-traffic periods:

-- Update table statistics
ANALYZE lastheard;
ANALYZE talkgroups;
ANALYZE lastheard_hourly_summary;

-- Vacuum to reclaim space (automatic in most PostgreSQL setups)
-- VACUUM ANALYZE lastheard;

-- Reindex if needed (rarely required)
-- REINDEX INDEX CONCURRENTLY idx_start;