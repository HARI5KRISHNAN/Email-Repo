import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { syncMailbox } from './services/imapService.js';
import { fetchInbox, fetchSent } from './services/dbService.js';
import { sendMail } from './services/smtpService.js';
import { verifyToken } from './middleware/auth.js';
dotenv.config();

const app = express();

// CORS configuration - allow frontend to make requests
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json());

app.get('/api/health', (_, res) => res.json({ status: 'OK' }));

// Protected routes - require authentication
app.get('/api/mail/inbox', verifyToken, async (req, res) => {
  try {
    // Use authenticated user's email
    const userEmail = req.user.email || 'bob@pilot180.local';
    console.log(`📬 Fetching inbox for ${userEmail}`);
    const inbox = await fetchInbox(userEmail);
    res.json(inbox);
  } catch (err) {
    console.error('❌ Error fetching inbox:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/mail/sent', verifyToken, async (req, res) => {
  try {
    // Use authenticated user's email
    const userEmail = req.user.email || 'alice@pilot180.local';
    console.log(`📤 Fetching sent emails for ${userEmail}`);
    const sent = await fetchSent(userEmail);
    res.json(sent);
  } catch (err) {
    console.error('❌ Error fetching sent emails:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/mail/send', verifyToken, async (req, res) => {
  try {
    const { from, to, subject, body } = req.body;
    const userEmail = req.user.email || from;
    console.log(`📧 Sending email from ${userEmail} to ${to}`);
    await sendMail({ from: userEmail, to, subject, text: body });
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error sending email:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => console.log(`📡 Mail backend listening on port ${PORT}`));

// --- Schedule background IMAP sync every 30s ---
cron.schedule('*/30 * * * * *', async () => {
  console.log('🔄 Syncing mailboxes...');
  await syncMailbox('bob@pilot180.local', '1234');
  await syncMailbox('alice@pilot180.local', '1234');
});