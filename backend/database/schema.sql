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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_start ON lastheard("Start" DESC);
CREATE INDEX IF NOT EXISTS idx_sourcecall ON lastheard("SourceCall");
CREATE INDEX IF NOT EXISTS idx_sourceid ON lastheard("SourceID");
CREATE INDEX IF NOT EXISTS idx_created_at ON lastheard(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_destinationid ON lastheard("DestinationID");

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


