-- Update email_change_tokens table structure to match backend implementation
-- This migration changes from double verification to single verification

-- Drop the existing table and recreate with simpler structure
DROP TABLE IF EXISTS public.email_change_tokens;

CREATE TABLE IF NOT EXISTS public.email_change_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    new_email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()),
    expires_at BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster token lookup
CREATE INDEX IF NOT EXISTS idx_email_change_token ON email_change_tokens(token);

COMMENT ON TABLE email_change_tokens IS 'Single-step email change verification tokens';