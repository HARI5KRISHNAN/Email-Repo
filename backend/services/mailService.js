import nodemailer from 'nodemailer';
import db from '../config/db.js';

export async function sendMail({ from, to, subject, text, html, owner }) {
  // transporter uses configured SMTP (MailHog / local)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: Number(process.env.SMTP_PORT || 1025),
    secure: (process.env.SMTP_SECURE === 'true'),
    tls: {
      rejectUnauthorized: false  // Allow self-signed certificates for local dev
    }
  });

  const info = await transporter.sendMail({
    from: from || process.env.SMTP_FROM || 'no-reply@pilot180.local',
    to: to.join(','),
    subject,
    text,
    html
  });

  // persist to DB (folder SENT) and include owner
  await db.query(
    `INSERT INTO mails (message_id, from_address, to_addresses, subject, body_html, body_text, owner, folder, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now())`,
    [info.messageId || null, from || null, to, subject || null, html || null, text || null, owner || null, 'SENT']
  );

  return info;
}
