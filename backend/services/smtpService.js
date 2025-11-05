import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export async function sendMail({ from, to, subject, text }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'pilot180-postfix',
    port: process.env.SMTP_PORT || 25,
    secure: process.env.SMTP_SECURE === 'true',
    tls: { rejectUnauthorized: false }
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    text
  });

  console.log(`✉️  Sent mail from ${from} to ${to}`);
}
