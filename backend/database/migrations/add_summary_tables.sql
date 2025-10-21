-- Migration: Add hourly summary tables
-- Purpose: Create tables for periodic data summarization
-- Date: 2025-10-20

-- Create lastheard_hourly_summary table
CREATE TABLE IF NOT EXISTS public.lastheard_hourly_summary (
    id SERIAL PRIMARY KEY,
    hour_start bigint NOT NULL,  -- Start of the hour (unix timestamp)
    hour_end bigint NOT NULL,    -- End of the hour (unix timestamp)
    source_id integer NOT NULL,
    source_call text NOT NULL,
    source_name text,
    destination_id integer NOT NULL,
    destination_call text,
    destination_name text,
    total_calls integer NOT NULL DEFAULT 0,
    total_duration integer NOT NULL DEFAULT 0,
    avg_duration integer NOT NULL DEFAULT 0,
    min_duration integer,
    max_duration integer,
    first_call_start bigint,     -- Timestamp of first call in this hour
    last_call_start bigint,      -- Timestamp of last call in this hour
    created_at bigint DEFAULT EXTRACT(epoch FROM now()),
    updated_at bigint DEFAULT EXTRACT(epoch FROM now())
);

-- Create summary_processing_log table
CREATE TABLE IF NOT EXISTS public.summary_processing_log (
    id SERIAL PRIMARY KEY,
    last_processed_timestamp bigint NOT NULL,
    last_processed_record_id integer NOT NULL,
    processing_started_at bigint NOT NULL,
    processing_completed_at bigint,
    records_processed integer DEFAULT 0,
    status text DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed'
    error_message text,
    created_at bigint DEFAULT EXTRACT(epoch FROM now())
);

-- Create indexes for lastheard_hourly_summary
CREATE INDEX IF NOT EXISTS idx_hourly_summary_time_range ON lastheard_hourly_summary(hour_start, hour_end);
CREATE INDEX IF NOT EXISTS idx_hourly_summary_source ON lastheard_hourly_summary(source_id, source_call);
CREATE INDEX IF NOT EXISTS idx_hourly_summary_destination ON lastheard_hourly_summary(destination_id);
CREATE INDEX IF NOT EXISTS idx_hourly_summary_talkgroup_time ON lastheard_hourly_summary(destination_id, hour_start);
CREATE INDEX IF NOT EXISTS idx_hourly_summary_callsign_time ON lastheard_hourly_summary(source_call, hour_start);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_hourly_summary_composite ON lastheard_hourly_summary(destination_id, source_call, hour_start);

-- Unique constraint to prevent duplicate hourly summaries for same source/destination/hour
CREATE UNIQUE INDEX IF NOT EXISTS idx_hourly_summary_unique ON lastheard_hourly_summary(hour_start, source_id, destination_id);

-- Index for processing log
CREATE INDEX IF NOT EXISTS idx_summary_log_timestamp ON summary_processing_log(last_processed_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_summary_log_status ON summary_processing_log(status);

-- Comments for documentation
COMMENT ON TABLE lastheard_hourly_summary IS 'Hourly aggregated summary of LastHeard data by talkgroup and callsign';
COMMENT ON TABLE summary_processing_log IS 'Log of summary processing runs for incremental updates';

COMMENT ON COLUMN lastheard_hourly_summary.hour_start IS 'Unix timestamp of hour start (rounded down to hour boundary)';
COMMENT ON COLUMN lastheard_hourly_summary.hour_end IS 'Unix timestamp of hour end (hour_start + 3599 seconds)';
COMMENT ON COLUMN lastheard_hourly_summary.total_calls IS 'Total number of calls in this hour for this source/destination combination';
COMMENT ON COLUMN lastheard_hourly_summary.total_duration IS 'Total duration in seconds of all calls in this hour';
COMMENT ON COLUMN lastheard_hourly_summary.avg_duration IS 'Average duration of calls in this hour';
COMMENT ON COLUMN lastheard_hourly_summary.first_call_start IS 'Timestamp of the first call in this hour';
COMMENT ON COLUMN lastheard_hourly_summary.last_call_start IS 'Timestamp of the last call in this hour';