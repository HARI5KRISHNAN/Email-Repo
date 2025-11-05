import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import db from './config/db.js';

export function startSmtpServer() {
  const server = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
      simpleParser(stream)
        .then(async parsed => {
          try {
            const from = parsed.from?.value?.map(v => v.address).join(',') || null;
            const toArr = (parsed.to?.value || []).map(v => v.address);
            const subject = parsed.subject || null;
            const html = parsed.html || null;
            const text = parsed.text || null;
            const owner = toArr[0] || null; // owner assignment heuristic

            await db.query(
              `INSERT INTO mails (message_id, from_address, to_addresses, subject, body_html, body_text, owner, folder, received_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())`,
              [parsed.messageId || null, from, toArr, subject, html, text, owner, 'INBOX']
            );
            console.log('Stored incoming mail for', owner);
            callback(null);
          } catch (err) {
            console.error('Error saving incoming mail:', err);
            callback(err);
          }
        })
        .catch(err => {
          console.error('Parse error', err);
          callback(err);
        });
    },
    disabledCommands: ['STARTTLS','AUTH'],
    logger: false
  });

  const listenPort = Number(process.env.SMTP_RECEIVER_PORT || 2525);
  server.listen(listenPort, () => console.log(`SMTP receiver listening on ${listenPort}`));
}
