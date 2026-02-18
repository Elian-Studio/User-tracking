CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  service_key VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id),
  user_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id),
  session_id UUID NOT NULL REFERENCES sessions(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('page_view', 'scroll', 'exit')),
  path TEXT NOT NULL,
  referrer TEXT,
  scroll_percent SMALLINT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),
  utm_term VARCHAR(255),
  utm_content VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_service_id ON events(service_id);
CREATE INDEX idx_events_session_id ON events(session_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_created_at ON events(created_at);
CREATE INDEX idx_sessions_service_id ON sessions(service_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at);
