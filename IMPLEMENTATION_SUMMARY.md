# Multi-User Mail System - Implementation Summary

## What Was Implemented

A complete multi-user email system with Keycloak authentication and per-user mail isolation has been successfully implemented.

## Key Features

### 1. Per-User Mail Isolation
- Each email has an `owner` field (Keycloak username/email)
- Users can only see emails where:
  - They are the owner, OR
  - They are in the recipient list (`to_addresses`)
- Database queries are filtered server-side to enforce isolation

### 2. Keycloak Authentication
- Frontend: Public client (`ai-email-assistant`)
- Backend: Confidential client (`mail-backend`)
- Token-based API authentication
- Automatic token refresh

### 3. Email Functionality
- Send emails via REST API
- Receive emails via SMTP (port 2525)
- View inbox with per-user filtering
- Search emails
- Full HTML and plain text support

### 4. SMTP Integration
- **Outgoing**: Uses Nodemailer to send to MailHog/SMTP server
- **Incoming**: Custom SMTP server on port 2525 ingests emails to database

## File Structure

```
mailbox-ui-clone/
├── backend/
│   ├── config/
│   │   ├── db.js              # PostgreSQL connection
│   │   └── keycloak.js        # Keycloak middleware setup
│   ├── routes/
│   │   └── mailRoutes.js      # Mail API endpoints
│   ├── services/
│   │   └── mailService.js     # Email sending service
│   ├── migrations/
│   │   └── 001_create_mails.sql  # Database schema
│   ├── index.js               # Main server entry point
│   ├── smtpReceiver.js        # SMTP server for incoming mail
│   ├── package.json           # Dependencies
│   ├── .env                   # Environment config
│   ├── .env.example           # Example config
│   ├── Dockerfile             # Docker image
│   └── README.md              # Backend documentation
│
├── components/
│   ├── Compose.tsx            # NEW: Email compose component
│   ├── EmailDetail.tsx        # Existing
│   ├── EmailList.tsx          # Existing (updated for new API)
│   ├── Header.tsx             # Existing
│   └── Sidebar.tsx            # Existing
│
├── App.tsx                    # Main app (already has Keycloak)
├── index.tsx                  # App entry point
├── api.ts                     # API client with auth interceptor
├── keycloak.ts                # UPDATED: Added initKeycloak()
├── types.ts                   # UPDATED: Backend response types
├── emailTransformer.ts        # UPDATED: Transform backend → frontend
│
├── docker-compose.yml         # NEW: Services setup
├── .env                       # Frontend env vars
├── SETUP.md                   # NEW: Complete setup guide
└── IMPLEMENTATION_SUMMARY.md  # This file
```

## Backend API Endpoints

All endpoints require `Authorization: Bearer <token>` header.

### GET `/api/mail/inbox`
Returns emails for the logged-in user.

**Response:**
```json
{
  "ok": true,
  "rows": [
    {
      "id": 1,
      "from_address": "alice@example.com",
      "to_addresses": ["bob@example.com"],
      "subject": "Hello",
      "body_text": "Message",
      "created_at": "2025-11-04T12:00:00Z",
      "owner": "bob@example.com"
    }
  ]
}
```

### GET `/api/mail/:id`
Returns a single email (only if user has access).

### POST `/api/mail/send`
Sends an email.

**Request:**
```json
{
  "to": ["recipient@example.com"],
  "subject": "Test",
  "text": "Plain text",
  "html": "<p>HTML content</p>"
}
```

### GET `/api/mail/search?q=keyword`
Searches user's emails by subject or body.

## Database Schema

```sql
CREATE TABLE mails (
  id BIGSERIAL PRIMARY KEY,
  message_id TEXT,
  from_address TEXT,
  to_addresses TEXT[] DEFAULT ARRAY[]::TEXT[],
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  headers JSONB,
  folder TEXT DEFAULT 'INBOX',
  owner TEXT,                    -- Keycloak username/email
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  received_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_mails_owner_created_at ON mails(owner, created_at DESC);
CREATE INDEX idx_mails_to_addresses_gin ON mails USING GIN (to_addresses);
```

## Security Implementation

### Token Validation Flow

1. **Frontend Login**
   - User redirects to Keycloak
   - Authenticates and receives JWT token
   - Token stored in Keycloak client

2. **API Request**
   - Frontend includes token in `Authorization` header
   - Backend validates token via Keycloak middleware
   - Extracts username from token claims

3. **Database Query**
   - Backend filters by `owner = username OR username IN to_addresses`
   - Ensures users only see their own data

### Username Extraction

The backend extracts username from Keycloak token using:

```javascript
function getUsername(req) {
  return req.kauth?.grant?.access_token?.content?.preferred_username
      || req.kauth?.grant?.access_token?.content?.email
      || req.kauth?.grant?.access_token?.content?.sub;
}
```

This tries (in order):
1. `preferred_username` (Keycloak username)
2. `email` (email address)
3. `sub` (subject/user ID)

## Environment Variables

### Backend (backend/.env)
```env
PORT=8081
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=pilot180mail
KEYCLOAK_URL=http://localhost:8080/
KEYCLOAK_REALM=pilot180
KEYCLOAK_CLIENT_ID=mail-backend
KEYCLOAK_CLIENT_SECRET=<from_keycloak>
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_FROM=no-reply@pilot180.local
SMTP_RECEIVER_PORT=2525
SESSION_SECRET=random_secret
```

### Frontend (.env)
```env
VITE_KEYCLOAK_URL=http://localhost:8080/
VITE_KEYCLOAK_REALM=pilot180
VITE_KEYCLOAK_CLIENT_ID=ai-email-assistant
VITE_API_BASE=http://localhost:8081/api
```

## Docker Services

The `docker-compose.yml` provides:

1. **PostgreSQL** - Database on port 5432
2. **Keycloak** - Auth server on port 8080
3. **MailHog** - SMTP testing on ports 1025 (SMTP) and 8025 (UI)

Start with:
```bash
docker-compose up -d
```

## Keycloak Configuration

### Realm: pilot180

### Clients:

1. **ai-email-assistant** (Frontend)
   - Type: Public
   - Access Type: public
   - Valid Redirect URIs: `http://localhost:5173/*`, `http://localhost:3006/*`
   - Web Origins: `*`

2. **mail-backend** (Backend)
   - Type: Confidential
   - Access Type: confidential
   - Valid Redirect URIs: `http://localhost:8081/*`
   - Service Accounts: Enabled
   - Copy client secret to backend `.env`

### Users:

Create test users with:
- Username (e.g., `alice`, `bob`)
- Email (e.g., `alice@pilot180.local`)
- Password (set via Credentials tab)

## Testing the Implementation

### 1. Start Services
```bash
# Start Docker services
docker-compose up -d

# Run database migration
psql -h localhost -U postgres -d pilot180mail -f backend/migrations/001_create_mails.sql

# Start backend
cd backend
npm install
npm start

# Start frontend (in another terminal)
cd ..
npm install
npm run dev
```

### 2. Test Login
- Open http://localhost:5173
- Should redirect to Keycloak
- Login with test user
- Should see mail UI

### 3. Test Sending
Use the Compose component or API:
```bash
curl -X POST http://localhost:8081/api/mail/send \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["bob@pilot180.local"],
    "subject": "Test",
    "text": "Hello Bob"
  }'
```

Check MailHog UI at http://localhost:8025

### 4. Test Per-User Isolation

1. Login as `alice` → Send email to `bob`
2. Logout and login as `bob` → Should see the email
3. Login as `charlie` → Should NOT see alice→bob email

### 5. Test SMTP Receiver

Send email directly to SMTP receiver:
```bash
telnet localhost 2525
EHLO localhost
MAIL FROM: external@test.com
RCPT TO: alice@pilot180.local
DATA
Subject: External Email
From: external@test.com
To: alice@pilot180.local

This is from outside.
.
QUIT
```

Check database:
```bash
psql -h localhost -U postgres -d pilot180mail -c "SELECT * FROM mails WHERE owner = 'alice@pilot180.local';"
```

## Code Changes Summary

### New Files
- `backend/` - Entire backend directory
- `components/Compose.tsx` - Email compose UI
- `docker-compose.yml` - Services setup
- `SETUP.md` - Complete setup guide
- `IMPLEMENTATION_SUMMARY.md` - This file

### Modified Files
- `keycloak.ts` - Added `initKeycloak()` function with token refresh
- `types.ts` - Updated `BackendEmail` and `EmailListResponse` interfaces
- `emailTransformer.ts` - Updated to handle new backend response format
- `.env` - Verified environment variables

### Unchanged Files (Already Working)
- `App.tsx` - Already has Keycloak integration
- `index.tsx` - Already initializes Keycloak
- `api.ts` - Already has auth interceptor
- `components/Header.tsx`, `EmailList.tsx`, `EmailDetail.tsx`, `Sidebar.tsx`

## How It Works

### Send Email Flow
```
User → Compose Component → POST /api/mail/send
  → Backend validates token
  → Extracts username from token
  → Sends email via Nodemailer to SMTP server
  → Stores in database with owner = username, folder = SENT
  → Returns success
```

### Receive Email Flow (SMTP)
```
External SMTP Client → Port 2525
  → smtpReceiver.js receives email
  → Parses with mailparser
  → Stores in database with owner = first_recipient, folder = INBOX
```

### Inbox Query Flow
```
User → GET /api/mail/inbox
  → Backend validates token
  → Extracts username
  → Queries: SELECT * FROM mails WHERE owner = username OR username = ANY(to_addresses)
  → Returns filtered results
  → Frontend transforms to UI format
```

## Next Steps / Enhancements

### Immediate Improvements
1. Add Compose button to Header component
2. Implement email folders (Sent, Drafts, Trash)
3. Add "Mark as read/unread" functionality
4. Implement email deletion (soft delete to trash folder)

### Medium-term Features
1. File attachments (store in S3/object storage)
2. Email threading (group conversations)
3. Full-text search with PostgreSQL tsvector
4. Real-time notifications via WebSocket/Server-Sent Events
5. Email templates

### Production Readiness
1. Replace MailHog with real SMTP relay (SendGrid, AWS SES)
2. Set up SSL/TLS for all services
3. Use managed PostgreSQL (AWS RDS, etc.)
4. Configure Keycloak with proper SSL and production settings
5. Add rate limiting and API security
6. Set up monitoring and logging (Sentry, LogRocket)
7. Implement database backups

### Advanced Features
1. AI-powered email categorization
2. Smart replies and compose assistance
3. Spam detection
4. Email scheduling
5. Calendar integration
6. Contact management

## Troubleshooting

### Common Issues

1. **"Connecting to authentication..."**
   - Keycloak not running or wrong URL
   - Check `.env` variables
   - Verify Keycloak realm and client exist

2. **401 Unauthorized**
   - Wrong client secret in backend `.env`
   - Token expired (should auto-refresh)
   - Backend can't reach Keycloak

3. **Empty inbox**
   - No emails in database for this user
   - Check `owner` field matches username
   - Try sending a test email

4. **Database connection error**
   - PostgreSQL not running
   - Wrong credentials in `.env`
   - Database doesn't exist

## Resources

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [PostgreSQL Array Types](https://www.postgresql.org/docs/current/arrays.html)
- [Nodemailer](https://nodemailer.com/)
- [SMTP Server](https://nodemailer.com/extras/smtp-server/)
- [Keycloak Connect](https://www.npmjs.com/package/keycloak-connect)

## Support

For issues or questions:
1. Check [SETUP.md](SETUP.md) for detailed setup instructions
2. Check [backend/README.md](backend/README.md) for API documentation
3. Review backend logs for error messages
4. Check Keycloak admin console for configuration issues
5. Verify database schema matches migration file

## License

MIT
