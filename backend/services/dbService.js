import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

export const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'pilot180-mail-postgres',
  port: process.env.POSTGRES_PORT || 5432,
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'pilot180mail'
});

export async function saveEmailToDB(email) {
  const query = `
    INSERT INTO mails (from_email, to_email, subject, body, date)
    VALUES ($1, $2, $3, $4, $5)
  `;
  await pool.query(query, [
    email.from,
    email.to,
    email.subject,
    email.body,
    email.date || new Date()
  ]);
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
