-- Create drafts table for saving email drafts
CREATE TABLE IF NOT EXISTS drafts (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  to_recipients TEXT[] DEFAULT '{}',
  cc_recipients TEXT[] DEFAULT '{}',
  subject VARCHAR(500) DEFAULT '',
  body TEXT DEFAULT '',
  draft_type VARCHAR(50) DEFAULT 'compose', -- 'compose', 'reply', 'forward'
  in_reply_to VARCHAR(255), -- message_id of the email being replied to
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on user_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_drafts_user_email ON drafts(user_email);

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_drafts_updated_at ON drafts(updated_at DESC);

-- Create index on draft_type for filtering
CREATE INDEX IF NOT EXISTS idx_drafts_type ON drafts(draft_type);
