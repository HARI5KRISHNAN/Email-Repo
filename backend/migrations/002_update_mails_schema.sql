-- Drop the old table and create new one with correct schema
DROP TABLE IF EXISTS mails;

CREATE TABLE mails (
  id BIGSERIAL PRIMARY KEY,
  message_id TEXT,
  from_address TEXT,
  to_addresses TEXT[] DEFAULT ARRAY[]::TEXT[],
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  headers JSONB,
  folder TEXT DEFAULT 'INBOX',
  owner TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_mails_owner_created_at ON mails(owner, created_at DESC);
CREATE INDEX idx_mails_to_addresses_gin ON mails USING GIN(to_addresses);
CREATE INDEX idx_mails_folder ON mails(folder);
CREATE INDEX idx_mails_message_id ON mails(message_id);
