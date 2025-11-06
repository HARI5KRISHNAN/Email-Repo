-- Add is_starred column to support starring emails
ALTER TABLE mails ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT false;

-- Create index for faster queries on starred emails
CREATE INDEX IF NOT EXISTS idx_mails_starred ON mails(owner, is_starred) WHERE is_starred = true;
