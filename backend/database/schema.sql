-- Create database schema for BM Last Heard
CREATE TABLE IF NOT EXISTS public.lastheard (
    id SERIAL PRIMARY KEY,
    "SourceID" integer NOT NULL,
    "DestinationID" integer NOT NULL,
    "SourceCall" text NOT NULL,
    "SourceName" text,
    "DestinationCall" text,
    "DestinationName" text,
    "Start" bigint NOT NULL,
    "Stop" bigint,
    "TalkerAlias" text,
    duration integer,
    created_at bigint DEFAULT EXTRACT(epoch FROM now())
);

-- Create talkgroups table
CREATE TABLE IF NOT EXISTS public.talkgroups (
    talkgroup_id integer PRIMARY KEY,
    name text NOT NULL,
    country text,
    continent text,
    full_country_name text,
    last_updated bigint DEFAULT EXTRACT(epoch FROM now())
);

-- Create users table for user registration
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    callsign TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()),
    last_login_at BIGINT,
    locale TEXT DEFAULT 'en'
);

-- Create user_verifications table for email verification during registration
CREATE TABLE IF NOT EXISTS public.user_verifications (
    id SERIAL PRIMARY KEY,
    callsign TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    verification_token TEXT UNIQUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()),
    expires_at BIGINT NOT NULL,
    locale TEXT DEFAULT 'en'
);

-- Create sessions table for user sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id SERIAL PRIMARY KEY,
    session_token TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()),
    expires_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create password_reset_tokens table for password recovery
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    reset_token TEXT UNIQUE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()),
    expires_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create email_change_tokens table for email change verification
CREATE TABLE IF NOT EXISTS public.email_change_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    old_email TEXT NOT NULL,
    new_email TEXT NOT NULL,
    old_email_token TEXT UNIQUE NOT NULL,
    new_email_token TEXT UNIQUE,
    old_email_verified BOOLEAN DEFAULT FALSE,
    new_email_verified BOOLEAN DEFAULT FALSE,
    created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()),
    expires_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create lastheard_hourly_summary table for periodic data summarization
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

-- Create summary_processing_log table for tracking summary processing runs
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_start ON lastheard("Start" DESC);
CREATE INDEX IF NOT EXISTS idx_sourcecall ON lastheard("SourceCall");
CREATE INDEX IF NOT EXISTS idx_sourceid ON lastheard("SourceID");
CREATE INDEX IF NOT EXISTS idx_created_at ON lastheard(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_destinationid ON lastheard("DestinationID");

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

-- Create indexes for talkgroups table
CREATE INDEX IF NOT EXISTS idx_talkgroups_country ON talkgroups(country);
CREATE INDEX IF NOT EXISTS idx_talkgroups_continent ON talkgroups(continent);
CREATE INDEX IF NOT EXISTS idx_talkgroups_name ON talkgroups(name);
CREATE INDEX IF NOT EXISTS idx_talkgroups_last_updated ON talkgroups(last_updated);

-- Create indexes for users and authentication tables
CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_callsign ON users(callsign);
CREATE INDEX IF NOT EXISTS idx_user_verification_token ON user_verifications(verification_token);
CREATE INDEX IF NOT EXISTS idx_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens(reset_token);
CREATE INDEX IF NOT EXISTS idx_old_email_token ON email_change_tokens(old_email_token);
CREATE INDEX IF NOT EXISTS idx_new_email_token ON email_change_tokens(new_email_token);

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


