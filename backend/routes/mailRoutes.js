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

// get spam folder for logged-in user
router.get('/mail/spam', authenticateToken, async (req, res) => {
  const user = getUsername(req);
  try {
    const mailDomain = process.env.MAIL_DOMAIN || 'pilot180.local';
    const userEmail = user.includes('@') ? user : `${user}@${mailDomain}`;

    const q = await db.query(
      `SELECT id, message_id, from_address, to_addresses, subject, body_text, body_html, folder, owner, is_starred, is_read, is_spam, created_at
       FROM mails
       WHERE (owner = $1 OR $2 = ANY(to_addresses)) AND folder = 'SPAM'
       ORDER BY created_at DESC LIMIT 200`, [user, userEmail]
    );
    res.json({ ok: true, rows: q.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// get trash folder for logged-in user
router.get('/mail/trash', authenticateToken, async (req, res) => {
  const user = getUsername(req);
  try {
    const mailDomain = process.env.MAIL_DOMAIN || 'pilot180.local';
    const userEmail = user.includes('@') ? user : `${user}@${mailDomain}`;

    const q = await db.query(
      `SELECT id, message_id, from_address, to_addresses, subject, body_text, body_html, folder, owner, is_starred, is_read, is_spam, created_at
       FROM mails
       WHERE (owner = $1 OR $2 = ANY(to_addresses)) AND folder = 'TRASH'
       ORDER BY created_at DESC LIMIT 200`, [user, userEmail]
    );
    res.json({ ok: true, rows: q.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// get calendar meetings for logged-in user
router.get('/mail/calendar/meetings', authenticateToken, async (req, res) => {
  const user = getUsername(req);
  try {
    const mailDomain = process.env.MAIL_DOMAIN || 'pilot180.local';
    const userEmail = user.includes('@') ? user : `${user}@${mailDomain}`;

    // Check if meetings table exists, if not return empty array
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'meetings'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      return res.json({ ok: true, meetings: [] });
    }

    // Fetch meetings where user is organizer or attendee
    const q = await db.query(
      `SELECT id, title, description, start_time, end_time, location, organizer, attendees, created_at
       FROM meetings
       WHERE organizer = $1 OR $2 = ANY(attendees)
       ORDER BY start_time ASC`, [userEmail, userEmail]
    );
    res.json({ ok: true, meetings: q.rows });
  } catch (err) {
    console.error('Calendar meetings error:', err);
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
        COUNT(*) FILTER (WHERE is_starred = true AND is_read = false) as important_unread,
        COUNT(*) FILTER (WHERE folder = 'SPAM') as spam_unread,
        COUNT(*) FILTER (WHERE folder = 'TRASH') as trash_unread
      FROM mails
      WHERE owner = $1 OR $2 = ANY(to_addresses)
    `, [user, userEmail]);

    const result = {
      ok: true,
      counts: {
        inbox: parseInt(counts.rows[0].inbox_unread),
        sent: parseInt(counts.rows[0].sent_unread),
        important: parseInt(counts.rows[0].important_unread),
        spam: parseInt(counts.rows[0].spam_unread),
        trash: parseInt(counts.rows[0].trash_unread)
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

// Move single email to folder (INBOX, SPAM, TRASH, ARCHIVE)
router.post('/mail/:id/move', authenticateToken, async (req, res) => {
  const user = getUsername(req);
  const id = req.params.id;
  const { to } = req.body;

  try {
    if (!to) {
      return res.status(400).json({ ok: false, error: 'Missing target folder "to"' });
    }

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

    // Move to folder and update is_spam if moving to SPAM
    const updateQ = 'UPDATE mails SET folder = $1, is_spam = ($1 = $2) WHERE id = $3 RETURNING *';
    const result = await db.query(updateQ, [to, 'SPAM', id]);

    res.json({ ok: true, mail: result.rows[0] });
  } catch (err) {
    console.error('Move mail error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Delete single email (soft delete -> move to TRASH)
router.delete('/mail/:id', authenticateToken, async (req, res) => {
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

    // Soft delete: move to TRASH
    await db.query('UPDATE mails SET folder = $1 WHERE id = $2', ['TRASH', id]);

    res.json({ ok: true });
  } catch (err) {
    console.error('Delete mail error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Bulk actions endpoint
router.post('/mail/bulk', authenticateToken, async (req, res) => {
  const user = getUsername(req);
  const { ids, action, to } = req.body;

  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ ok: false, error: 'ids array is required' });
    }

    const mailDomain = process.env.MAIL_DOMAIN || 'pilot180.local';
    const userEmail = user.includes('@') ? user : `${user}@${mailDomain}`;

    // Verify user has permission for all emails
    const checkQ = await db.query(
      'SELECT id FROM mails WHERE id = ANY($1::int[]) AND (owner = $2 OR $3 = ANY(to_addresses))',
      [ids, user, userEmail]
    );

    const allowedIds = checkQ.rows.map(row => row.id);
    if (allowedIds.length === 0) {
      return res.status(403).json({ ok: false, error: 'No permission for these emails' });
    }

    // Perform action
    if (action === 'delete') {
      await db.query('UPDATE mails SET folder = $1 WHERE id = ANY($2::int[])', ['TRASH', allowedIds]);
      return res.json({ ok: true, count: allowedIds.length });
    }

    if (action === 'spam') {
      await db.query(
        'UPDATE mails SET folder = $1, is_spam = true WHERE id = ANY($2::int[])',
        ['SPAM', allowedIds]
      );
      return res.json({ ok: true, count: allowedIds.length });
    }

    if (action === 'move') {
      if (!to) {
        return res.status(400).json({ ok: false, error: 'to folder is required for move action' });
      }
      await db.query('UPDATE mails SET folder = $1 WHERE id = ANY($2::int[])', [to, allowedIds]);
      return res.json({ ok: true, count: allowedIds.length });
    }

    if (action === 'read' || action === 'unread') {
      const readVal = action === 'read';
      await db.query('UPDATE mails SET is_read = $1 WHERE id = ANY($2::int[])', [readVal, allowedIds]);
      return res.json({ ok: true, count: allowedIds.length });
    }

    res.status(400).json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    console.error('Bulk action error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Permanent delete endpoint (use with caution)
router.delete('/mail/:id/permanent', authenticateToken, async (req, res) => {
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

    // Permanent delete from database
    await db.query('DELETE FROM mails WHERE id = $1', [id]);

    res.json({ ok: true });
  } catch (err) {
    console.error('Permanent delete error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
