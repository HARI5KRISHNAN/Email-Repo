import express from 'express';
import db from '../config/db.js';
import { sendMail } from '../services/mailService.js';
import { fetchImapEmails } from '../services/imapService.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

// helper to read username/email from Keycloak token
function getUsername(req) {
  // token content attached by authMiddleware
  return req.kauth?.grant?.access_token?.content?.preferred_username
      || req.kauth?.grant?.access_token?.content?.email
      || req.kauth?.grant?.access_token?.content?.sub;
}

const router = express.Router();

// get inbox for logged-in user
router.get('/mail/inbox', authenticateToken, async (req, res) => {
  const user = getUsername(req);
  try {
    // Construct full email address
    const mailDomain = process.env.MAIL_DOMAIN || 'pilot180.local';
    const userEmail = user.includes('@') ? user : `${user}@${mailDomain}`;

    // Sync emails from IMAP before fetching from database
    try {
      // Use default password 'password' for development
      await fetchImapEmails(userEmail, 'password');
    } catch (imapErr) {
      console.error('IMAP sync failed (non-fatal):', imapErr.message);
      // Continue even if IMAP fails - return what's in database
    }

    // fetch mails where owner = user OR user is in to_addresses
    const q = await db.query(
      `SELECT id, message_id, from_address, to_addresses, subject, body_text, body_html, folder, owner, is_starred, is_read, created_at
       FROM mails
       WHERE owner = $1 OR $2 = ANY(to_addresses)
       ORDER BY created_at DESC LIMIT 200`, [user, userEmail]
    );
    res.json({ ok: true, rows: q.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// get sent folder for logged-in user
router.get('/mail/sent', authenticateToken, async (req, res) => {
  const user = getUsername(req);
  try {
    const q = await db.query(
      `SELECT id, message_id, from_address, to_addresses, subject, body_text, body_html, folder, owner, is_starred, is_read, created_at
       FROM mails
       WHERE owner = $1 AND folder = 'SENT'
       ORDER BY created_at DESC LIMIT 200`, [user]
    );
    res.json({ ok: true, rows: q.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// get starred/important emails for logged-in user
router.get('/mail/important', authenticateToken, async (req, res) => {
  const user = getUsername(req);
  try {
    // Construct full email address
    const mailDomain = process.env.MAIL_DOMAIN || 'pilot180.local';
    const userEmail = user.includes('@') ? user : `${user}@${mailDomain}`;

    // Fetch starred emails where owner = user OR user is in to_addresses
    const q = await db.query(
      `SELECT id, message_id, from_address, to_addresses, subject, body_text, body_html, folder, owner, is_starred, is_read, created_at
       FROM mails
       WHERE (owner = $1 OR $2 = ANY(to_addresses)) AND is_starred = true
       ORDER BY created_at DESC LIMIT 200`, [user, userEmail]
    );
    res.json({ ok: true, rows: q.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// get folder counts for sidebar
router.get('/mail/counts', authenticateToken, async (req, res) => {
  const user = getUsername(req);
  console.log(`📊 Fetching counts for user: ${user}`);
  try {
    const mailDomain = process.env.MAIL_DOMAIN || 'pilot180.local';
    const userEmail = user.includes('@') ? user : `${user}@${mailDomain}`;

    const counts = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE folder = 'INBOX' AND is_read = false) as inbox_unread,
        COUNT(*) FILTER (WHERE folder = 'SENT' AND is_read = false) as sent_unread,
        COUNT(*) FILTER (WHERE is_starred = true AND is_read = false) as important_unread
      FROM mails
      WHERE owner = $1 OR $2 = ANY(to_addresses)
    `, [user, userEmail]);

    const result = {
      ok: true,
      counts: {
        inbox: parseInt(counts.rows[0].inbox_unread),
        sent: parseInt(counts.rows[0].sent_unread),
        important: parseInt(counts.rows[0].important_unread)
      }
    };
    console.log(`📊 Returning counts:`, result.counts);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// search
router.get('/mail/search', authenticateToken, async (req, res) => {
  const user = getUsername(req);
  const qtext = req.query.q || '';
  try {
    const q = await db.query(
      `SELECT id, from_address, subject, created_at FROM mails
       WHERE (owner = $1 OR $1 = ANY(to_addresses))
         AND (subject ILIKE $2 OR body_text ILIKE $2)
       ORDER BY created_at DESC LIMIT 200`, [user, `%${qtext}%`]
    );
    res.json({ ok: true, rows: q.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// get single mail (MUST come after specific string routes like /mail/sent, /mail/inbox, /mail/counts, /mail/search)
router.get('/mail/:id', authenticateToken, async (req, res) => {
  const user = getUsername(req);
  const id = req.params.id;
  try {
    // validate id is numeric to avoid accidental route clashes (e.g. '/mail/sent')
    if (!/^[0-9]+$/.test(String(id))) {
      return res.status(400).json({ ok: false, error: 'Invalid mail id' });
    }
    const q = await db.query('SELECT * FROM mails WHERE id=$1', [id]);
    if (!q.rows.length) return res.status(404).json({ ok: false, error: 'Not found' });
    const mail = q.rows[0];

    // Construct full email address for permission check
    const mailDomain = process.env.MAIL_DOMAIN || 'pilot180.local';
    const userEmail = user.includes('@') ? user : `${user}@${mailDomain}`;

    // ensure user is allowed to see it
    if (mail.owner !== user && !(mail.to_addresses || []).includes(userEmail)) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
    res.json({ ok: true, mail });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// send mail
router.post('/mail/send', authenticateToken, async (req, res) => {
  const user = getUsername(req);
  try {
    const { to, subject, text, html } = req.body;
    // normalize recipients to array of strings
    const toArray = Array.isArray(to) ? to : String(to || '').split(',').map(s => s.trim()).filter(Boolean);
    // construct full email address for "from" field
    const mailDomain = process.env.MAIL_DOMAIN || 'pilot180.local';
    const fromAddress = user.includes('@') ? user : `${user}@${mailDomain}`;
    // call sendMail service (which also persists message as SENT owned by user)
    const info = await sendMail({ from: fromAddress, to: toArray, subject, text, html, owner: user });
    res.json({ ok: true, info });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// mark email as read
router.patch('/mail/:id/read', authenticateToken, async (req, res) => {
  const user = getUsername(req);
  const id = req.params.id;

  try {
    const mailDomain = process.env.MAIL_DOMAIN || 'pilot180.local';
    const userEmail = user.includes('@') ? user : `${user}@${mailDomain}`;

    // Check if user has permission
    const checkQ = await db.query(
      'SELECT owner, to_addresses FROM mails WHERE id=$1',
      [id]
    );

    if (!checkQ.rows.length) {
      return res.status(404).json({ ok: false, error: 'Email not found' });
    }

    const mail = checkQ.rows[0];
    if (mail.owner !== user && !(mail.to_addresses || []).includes(userEmail)) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }

    // Mark as read
    console.log(`Marking email ${id} as read for user ${user}`);
    const updateResult = await db.query(
      'UPDATE mails SET is_read = true WHERE id = $1',
      [id]
    );
    console.log(`Update result:`, updateResult.rowCount, 'rows affected');

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// mark email as unread
router.patch('/mail/:id/unread', authenticateToken, async (req, res) => {
  const user = getUsername(req);
  const id = req.params.id;

  try {
    const mailDomain = process.env.MAIL_DOMAIN || 'pilot180.local';
    const userEmail = user.includes('@') ? user : `${user}@${mailDomain}`;

    // Check if user has permission
    const checkQ = await db.query(
      'SELECT owner, to_addresses FROM mails WHERE id=$1',
      [id]
    );

    if (!checkQ.rows.length) {
      return res.status(404).json({ ok: false, error: 'Email not found' });
    }

    const mail = checkQ.rows[0];
    if (mail.owner !== user && !(mail.to_addresses || []).includes(userEmail)) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }

    // Mark as unread
    await db.query(
      'UPDATE mails SET is_read = false WHERE id = $1',
      [id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// toggle star on email
router.patch('/mail/:id/star', authenticateToken, async (req, res) => {
  const user = getUsername(req);
  const id = req.params.id;
  const { isStarred } = req.body;

  try {
    // Construct full email address for permission check
    const mailDomain = process.env.MAIL_DOMAIN || 'pilot180.local';
    const userEmail = user.includes('@') ? user : `${user}@${mailDomain}`;

    // Check if user has permission to star this email
    const checkQ = await db.query(
      'SELECT owner, to_addresses FROM mails WHERE id=$1',
      [id]
    );

    if (!checkQ.rows.length) {
      return res.status(404).json({ ok: false, error: 'Email not found' });
    }

    const mail = checkQ.rows[0];
    if (mail.owner !== user && !(mail.to_addresses || []).includes(userEmail)) {
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }

    // Update the starred status
    await db.query(
      'UPDATE mails SET is_starred = $1 WHERE id = $2',
      [isStarred, id]
    );

    res.json({ ok: true, isStarred });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
