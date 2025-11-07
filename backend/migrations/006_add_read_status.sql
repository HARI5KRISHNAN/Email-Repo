-- Add is_read column to track read status
ALTER TABLE mails ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- Create index for faster queries on unread emails
CREATE INDEX IF NOT EXISTS idx_mails_unread ON mails(owner, is_read) WHERE is_read = false;
