import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { saveEmailToDB } from './dbService.js';
import dotenv from 'dotenv';
dotenv.config();

export async function syncMailbox(userEmail, password) {
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

    const searchCriteria = ['UNSEEN'];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT'],
      markSeen: true
    };

    const results = await connection.search(searchCriteria, fetchOptions);

    for (let res of results) {
      const all = res.parts.find(p => p.which === 'TEXT');
      const parsed = await simpleParser(all.body);

      const email = {
        from: parsed.from?.text || '',
        to: parsed.to?.text || '',
        subject: parsed.subject || '',
        body: parsed.text || '',
        date: parsed.date || new Date()
      };

      await saveEmailToDB(email);
      console.log(`📩 Synced new mail for ${userEmail}: ${email.subject}`);
    }

    connection.end();
  } catch (err) {
    console.error(`IMAP sync error for ${userEmail}:`, err.message);
  }
}