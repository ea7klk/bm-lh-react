-- Create database schema for BM Last Heard
CREATE TABLE IF NOT EXISTS last_heard (
    id SERIAL PRIMARY KEY,
    callsign VARCHAR(20) NOT NULL,
    name VARCHAR(100),
    dmr_id BIGINT NOT NULL,
    target_id BIGINT NOT NULL,
    target_name VARCHAR(100),
    source VARCHAR(50) NOT NULL,
    duration INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    slot INTEGER,
    reflector INTEGER
);

-- Create indexes for better query performance
CREATE INDEX idx_timestamp ON last_heard(timestamp DESC);
CREATE INDEX idx_callsign ON last_heard(callsign);
CREATE INDEX idx_dmr_id ON last_heard(dmr_id);

-- Insert sample data for testing
INSERT INTO last_heard (callsign, name, dmr_id, target_id, target_name, source, duration, slot, reflector, timestamp)
VALUES 
    ('EA7KLK', 'John Doe', 2147001, 214, 'Spain', 'BM Master', 120, 2, 4400, NOW() - INTERVAL '1 minute'),
    ('EA3ABC', 'Jane Smith', 2143002, 214, 'Spain', 'BM Master', 85, 1, 4400, NOW() - INTERVAL '5 minutes'),
    ('F1XYZ', 'Pierre Martin', 2081234, 208, 'France', 'BM Master', 150, 2, 4400, NOW() - INTERVAL '10 minutes'),
    ('G7DEF', 'Alice Brown', 2341567, 234, 'United Kingdom', 'BM Master', 95, 1, 4400, NOW() - INTERVAL '15 minutes'),
    ('DL9GHI', 'Hans Mueller', 2621890, 262, 'Germany', 'BM Master', 200, 2, 4400, NOW() - INTERVAL '20 minutes');
