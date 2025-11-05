import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { saveEmailToDB } from './dbService.js';
import dotenv from 'dotenv';
dotenv.config();

export async function fetchImapEmails(userEmail, password) {
  const config = {
    imap: {
      user: userEmail,
      password: password,
      host: process.env.IMAP_HOST || 'pilot180-dovecot',
      port: process.env.IMAP_PORT || 143,
      tls: process.env.IMAP_SECURE === 'true',
      authTimeout: 3000
    }
  };

  try {
    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    const searchCriteria = ['ALL'];
    const fetchOptions = {
      bodies: [''], // Fetch entire message
      markSeen: false
    };

    const results = await connection.search(searchCriteria, fetchOptions);

    for (let res of results) {
      // Get the full message body (empty string fetches entire message)
      const all = res.parts.find(p => p.which === '');
      if (!all || !all.body) {
        console.warn('Skipping email with missing body');
        continue;
      }
      const parsed = await simpleParser(all.body);

      const email = {
        messageId: parsed.messageId || `${Date.now()}-${Math.random()}@pilot180.local`,
        from: parsed.from?.text || '',
        to: parsed.to?.text || '',
        subject: parsed.subject || '',
        text: parsed.text || '',
        html: parsed.html || '',
        date: parsed.date || new Date(),
        folder: 'INBOX',
        owner: userEmail
      };

      await saveEmailToDB(email);
      console.log(`📩 Synced mail for ${userEmail}: ${email.subject}`);
    }

    connection.end();
  } catch (err) {
    console.error(`IMAP sync error for ${userEmail}:`, err.message);
  }
}