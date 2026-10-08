-- LabDrop Database Migration
-- Single table for temporary shares + lightweight rate limiting table

CREATE TABLE IF NOT EXISTS shares (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shares_code ON shares(code);
CREATE INDEX IF NOT EXISTS idx_shares_expires ON shares(expires_at);

CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    reset_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset ON rate_limits(reset_at);
