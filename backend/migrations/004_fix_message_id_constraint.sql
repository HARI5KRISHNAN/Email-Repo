-- Drop the old unique constraint and create a composite one
-- This allows the same message to appear in different folders for different owners
ALTER TABLE mails DROP CONSTRAINT IF EXISTS mails_message_id_unique;

-- Add composite unique constraint on (message_id, folder, owner)
-- This allows same message in SENT and INBOX folders
ALTER TABLE mails ADD CONSTRAINT mails_message_id_folder_owner_unique
  UNIQUE (message_id, folder, owner);
