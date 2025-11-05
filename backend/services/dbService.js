import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

export const pool = new Pool({
  host: process.env.PGHOST || process.env.POSTGRES_HOST || 'postgres',
  port: process.env.PGPORT || process.env.POSTGRES_PORT || 5432,
  user: process.env.PGUSER || process.env.POSTGRES_USER || 'postgres',
  password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.PGDATABASE || process.env.POSTGRES_DB || 'pilot180mail'
});

export async function saveEmailToDB(email) {
  // Extract message ID from email headers if available
  const messageId = email.messageId || `${Date.now()}@pilot180.local`;

  // Convert to/from to proper format
  const toAddresses = Array.isArray(email.to) ? email.to : [email.to];
  const fromAddress = typeof email.from === 'string' ? email.from : email.from?.text || '';

  const query = `
    INSERT INTO mails (message_id, from_address, to_addresses, subject, body_text, body_html, folder, owner, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (message_id, folder, owner) DO NOTHING
  `;

  try {
    await pool.query(query, [
      messageId,
      fromAddress,
      toAddresses,
      email.subject || '',
      email.body || email.text || '',
      email.html || '',
      email.folder || 'INBOX',
      email.owner || null,
      email.date || new Date()
    ]);
  } catch (err) {
    console.error('Error saving email to DB:', err.message);
  }
}

export async function fetchInbox(userEmail) {
  const { rows } = await pool.query(
    'SELECT * FROM mails WHERE to_email = $1 ORDER BY date DESC',
    [userEmail]
  );
  return rows;
}

export async function fetchSent(userEmail) {
  const { rows } = await pool.query(
    'SELECT * FROM mails WHERE from_email = $1 ORDER BY date DESC',
    [userEmail]
  );
  return rows;
}
