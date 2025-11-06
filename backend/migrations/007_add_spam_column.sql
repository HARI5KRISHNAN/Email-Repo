-- Add is_spam column to track spam emails
ALTER TABLE mails ADD COLUMN IF NOT EXISTS is_spam BOOLEAN DEFAULT false;

-- Create index for faster queries on spam emails
CREATE INDEX IF NOT EXISTS idx_mails_spam ON mails(owner, is_spam) WHERE is_spam = true;

-- Create index for folder queries with owner
CREATE INDEX IF NOT EXISTS idx_mails_folder_owner ON mails(owner, folder);
