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

-- Create indexes for better query performance
CREATE INDEX idx_start ON lastheard("Start" DESC);
CREATE INDEX idx_sourcecall ON lastheard("SourceCall");
CREATE INDEX idx_sourceid ON lastheard("SourceID");
CREATE INDEX idx_created_at ON lastheard(created_at DESC);
CREATE INDEX idx_destinationid ON lastheard("DestinationID");

-- Create indexes for talkgroups table
CREATE INDEX idx_talkgroups_country ON talkgroups(country);
CREATE INDEX idx_talkgroups_continent ON talkgroups(continent);
CREATE INDEX idx_talkgroups_name ON talkgroups(name);
CREATE INDEX idx_talkgroups_last_updated ON talkgroups(last_updated);


