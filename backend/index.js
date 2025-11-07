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
const allowedOrigins = [
  'http://localhost:3006',
  'http://localhost:3007',
  'http://localhost:5173', // Vite default
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url} from ${req.get('origin') || 'no-origin'}`);

  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`📤 Response ${res.statusCode} for ${req.method} ${req.url}`);
    return originalSend.call(this, data);
  };

  next();
});

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

// Debug middleware before routes
app.use('/api', (req, res, next) => {
  console.log(`🔍 Before routes: ${req.method} ${req.url}`);
  next();
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