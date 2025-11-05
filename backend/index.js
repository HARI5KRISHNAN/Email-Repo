import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import mailRoutes from './routes/mailRoutes.js';
import { startSmtpServer } from './smtpReceiver.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8081;

// CORS configuration - allow frontend to make requests
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3006',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware (required by Keycloak)
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Mount mail routes
app.use('/api', mailRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    ok: false,
    error: err.message || 'Internal server error'
  });
});

// Start REST API server
app.listen(PORT, () => {
  console.log(`🚀 Mail backend API listening on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});

// Start SMTP receiver for incoming mail
try {
  startSmtpServer();
  console.log(`📮 SMTP receiver started on port ${process.env.SMTP_RECEIVER_PORT || 2525}`);
} catch (err) {
  console.error('❌ Failed to start SMTP receiver:', err.message);
}

console.log('✅ Backend initialization complete');