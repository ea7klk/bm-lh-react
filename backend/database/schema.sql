-- Create database schema for BM Last Heard
CREATE TABLE public.lastheard (
    id integer NOT NULL,
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

-- Insert sample data for testing
INSERT INTO lastheard (id, "SourceID", "DestinationID", "SourceCall", "SourceName", "DestinationCall", "DestinationName", "Start", "Stop", "TalkerAlias", duration)
VALUES 
    (1, 2147001, 214, 'EA7KLK', 'John Doe', '214', 'Spain', EXTRACT(epoch FROM NOW() - INTERVAL '1 minute'), EXTRACT(epoch FROM NOW() - INTERVAL '1 minute') + 120, 'JD', 120),
    (2, 2143002, 214, 'EA3ABC', 'Jane Smith', '214', 'Spain', EXTRACT(epoch FROM NOW() - INTERVAL '5 minutes'), EXTRACT(epoch FROM NOW() - INTERVAL '5 minutes') + 85, 'JS', 85),
    (3, 2081234, 208, 'F1XYZ', 'Pierre Martin', '208', 'France', EXTRACT(epoch FROM NOW() - INTERVAL '10 minutes'), EXTRACT(epoch FROM NOW() - INTERVAL '10 minutes') + 150, 'PM', 150),
    (4, 2341567, 234, 'G7DEF', 'Alice Brown', '234', 'United Kingdom', EXTRACT(epoch FROM NOW() - INTERVAL '15 minutes'), EXTRACT(epoch FROM NOW() - INTERVAL '15 minutes') + 95, 'AB', 95),
    (5, 2621890, 262, 'DL9GHI', 'Hans Mueller', '262', 'Germany', EXTRACT(epoch FROM NOW() - INTERVAL '20 minutes'), EXTRACT(epoch FROM NOW() - INTERVAL '20 minutes') + 200, 'HM', 200);
