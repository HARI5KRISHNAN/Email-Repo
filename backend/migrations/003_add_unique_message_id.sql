-- Add unique constraint on message_id to support ON CONFLICT clause
ALTER TABLE mails ADD CONSTRAINT mails_message_id_unique UNIQUE (message_id);
