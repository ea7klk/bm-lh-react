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

-- Create indexes for better query performance
CREATE INDEX idx_start ON lastheard("Start" DESC);
CREATE INDEX idx_sourcecall ON lastheard("SourceCall");
CREATE INDEX idx_sourceid ON lastheard("SourceID");
CREATE INDEX idx_created_at ON lastheard(created_at DESC);


