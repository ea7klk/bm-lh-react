-- Database Optimization for BM Last Heard
-- Additional indexes to improve query performance

-- 1. Composite index for time-based queries with filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lastheard_time_dest_source 
ON lastheard ("Start" DESC, "DestinationID", "SourceID");

-- 2. Index for duration-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lastheard_duration_start 
ON lastheard (duration DESC, "Start" DESC) WHERE duration IS NOT NULL AND duration > 0;

-- 3. Composite index for talkgroup stats queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lastheard_dest_start_duration 
ON lastheard ("DestinationID", "Start" DESC, duration) WHERE duration IS NOT NULL;

-- 4. Index for polling new entries efficiently
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lastheard_created_start 
ON lastheard (created_at DESC, "Start" DESC);

-- 5. Partial index for recent data (last 30 days) - for frequently accessed data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lastheard_recent_start 
ON lastheard ("Start" DESC, "DestinationID", "SourceCall") 
WHERE "Start" > EXTRACT(EPOCH FROM NOW() - INTERVAL '30 days');

-- 6. Index for talkgroup joins optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_talkgroups_composite 
ON talkgroups (talkgroup_id, continent, country, name);

-- 7. ANALYZE tables to update statistics
ANALYZE lastheard;
ANALYZE talkgroups;
ANALYZE lastheard_hourly_summary;

-- 8. Configure PostgreSQL for better performance
-- Add these to your postgresql.conf:
/*
shared_buffers = 256MB                 # 25% of RAM
effective_cache_size = 1GB             # 75% of RAM  
work_mem = 4MB                         # For sorting operations
maintenance_work_mem = 64MB            # For maintenance operations
random_page_cost = 1.1                # For SSD storage
effective_io_concurrency = 200        # For SSD storage
max_connections = 100                  # Adjust based on your needs
*/