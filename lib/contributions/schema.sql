PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;
CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY);
INSERT OR IGNORE INTO schema_version VALUES (1);
CREATE TABLE IF NOT EXISTS contributions (
  id TEXT PRIMARY KEY, work_id TEXT NOT NULL, session_id TEXT NOT NULL,
  request_id TEXT NOT NULL, created_at TEXT NOT NULL, payload TEXT NOT NULL,
  UNIQUE(session_id, request_id)
);
CREATE INDEX IF NOT EXISTS work_contributions ON contributions(work_id, created_at);
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY, contribution_id TEXT NOT NULL, original_filename TEXT NOT NULL,
  mime TEXT NOT NULL, uploaded_at TEXT NOT NULL, stored_filename TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS moderation_events (
  id INTEGER PRIMARY KEY, contribution_id TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS authority_responses (id TEXT PRIMARY KEY, work_id TEXT NOT NULL, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT NOT NULL, bucket INTEGER NOT NULL, count INTEGER NOT NULL, PRIMARY KEY(key,bucket));
