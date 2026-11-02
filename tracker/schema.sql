-- aziz.life visitor tracker schema (Cloudflare D1 / SQLite)
-- Apply with:
--   npx wrangler d1 execute aziz-tracker --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS visitors (
    id            TEXT PRIMARY KEY,         -- persistent id from localStorage/cookie
    first_seen    TEXT NOT NULL,
    last_seen     TEXT NOT NULL,
    visits        INTEGER NOT NULL DEFAULT 0,   -- sessions
    pageviews     INTEGER NOT NULL DEFAULT 0,
    first_ip      TEXT,
    last_ip       TEXT,
    last_country  TEXT,
    last_city     TEXT,
    last_as_org   TEXT,
    last_ua       TEXT,
    is_bot        INTEGER NOT NULL DEFAULT 0,
    profile_json  TEXT                      -- latest reported device info (screen, languages, timezone)
);

CREATE TABLE IF NOT EXISTS sessions (
    id            TEXT PRIMARY KEY,
    visitor_id    TEXT NOT NULL,
    started_at    TEXT NOT NULL,
    last_seen     TEXT NOT NULL,
    pageviews     INTEGER NOT NULL DEFAULT 0,
    duration_ms   INTEGER NOT NULL DEFAULT 0,
    entry_page    TEXT,
    exit_page     TEXT,
    referrer      TEXT,
    utm_json      TEXT,
    ip            TEXT,
    country       TEXT,
    region        TEXT,
    city          TEXT,
    asn           INTEGER,
    as_org        TEXT,
    ua            TEXT,
    browser       TEXT,
    os            TEXT,
    device        TEXT,
    is_bot        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    ts            TEXT NOT NULL,
    type          TEXT NOT NULL,            -- pageview, click, scroll, heartbeat, exit, lang, error
    visitor_id    TEXT,
    session_id    TEXT,
    url           TEXT,
    path          TEXT,
    title         TEXT,
    referrer      TEXT,
    utm_json      TEXT,
    ip            TEXT,
    country       TEXT,
    region        TEXT,
    city          TEXT,
    postal        TEXT,
    lat           REAL,
    lon           REAL,
    timezone      TEXT,
    asn           INTEGER,
    as_org        TEXT,
    colo          TEXT,
    http_protocol TEXT,
    tls_version   TEXT,
    ua            TEXT,
    browser       TEXT,
    browser_ver   TEXT,
    os            TEXT,
    device        TEXT,
    language      TEXT,
    screen        TEXT,
    viewport      TEXT,
    is_bot        INTEGER NOT NULL DEFAULT 0,
    data_json     TEXT,                     -- event specific payload
    headers_json  TEXT                      -- raw request headers of interest
);

CREATE INDEX IF NOT EXISTS idx_events_ts        ON events (ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_visitor   ON events (visitor_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_events_session   ON events (session_id, ts);
CREATE INDEX IF NOT EXISTS idx_events_type      ON events (type, ts DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor ON sessions (visitor_id, started_at DESC);
