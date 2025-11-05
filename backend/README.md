# Pilot180 Mail Backend - Multi-User Setup

This backend implements per-user mail isolation using Keycloak authentication. Each user can only see their own emails and emails sent to them.

## Architecture

- **Express.js** - REST API server
- **PostgreSQL** - Database with per-user mail isolation
- **Keycloak** - Authentication and identity management
- **SMTP Server** - Incoming mail receiver (port 2525)
- **Nodemailer** - Outgoing mail sender (to MailHog/MailDev)

## Prerequisites

1. **PostgreSQL** running (e.g., via Docker)
2. **Keycloak** server running with `pilot180` realm configured
3. **MailHog or MailDev** for SMTP testing (optional but recommended)

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
PORT=8081

# Postgres
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=pilot180mail

# Keycloak
KEYCLOAK_URL=http://localhost:8080/
KEYCLOAK_REALM=pilot180
KEYCLOAK_CLIENT_ID=mail-backend
KEYCLOAK_CLIENT_SECRET=your_secret_from_keycloak

# SMTP (MailHog / MailDev)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_FROM=no-reply@pilot180.local

# SMTP receiver port
SMTP_RECEIVER_PORT=2525

# Session secret
SESSION_SECRET=your_random_secret_here
```

### 3. Set Up Database

Run the migration to create the `mails` table:

```bash
psql -h localhost -U postgres -d pilot180mail -f migrations/001_create_mails.sql
```

Or connect to your database and run the SQL manually.

### 4. Configure Keycloak

#### Create Backend Client

1. Go to Keycloak Admin Console → `pilot180` realm
2. Go to **Clients** → **Create**
3. Set:
   - **Client ID**: `mail-backend`
   - **Client Protocol**: `openid-connect`
   - **Access Type**: `confidential`
4. Save and go to **Credentials** tab
5. Copy the **Secret** and paste it into your `.env` as `KEYCLOAK_CLIENT_SECRET`

#### Set Valid Redirect URIs

- Add `http://localhost:8081/*` to the Valid Redirect URIs

### 5. Start the Backend

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

The backend will:
- Start REST API on port **8081**
- Start SMTP receiver on port **2525**

## API Endpoints

All endpoints require a valid Keycloak token in the `Authorization: Bearer <token>` header.

### GET `/api/mail/inbox`

Get inbox for the logged-in user.

**Response:**
```json
{
  "ok": true,
  "rows": [
    {
      "id": 1,
      "from_address": "user@example.com",
      "to_addresses": ["you@example.com"],
      "subject": "Hello",
      "body_text": "Message content",
      "created_at": "2025-11-04T12:00:00Z",
      "owner": "you@example.com",
      "folder": "INBOX"
    }
  ]
}
```

### GET `/api/mail/:id`

Get a single email by ID (only if user is owner or recipient).

### POST `/api/mail/send`

Send an email.

**Request Body:**
```json
{
  "to": ["recipient@example.com"],
  "subject": "Test Email",
  "text": "Plain text content",
  "html": "<p>HTML content</p>"
}
```

**Response:**
```json
{
  "ok": true,
  "info": { "messageId": "..." }
}
```

### GET `/api/mail/search?q=keyword`

Search user's emails by subject or body.

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
  owner TEXT, -- Keycloak username or email
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  received_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Indexes

- `idx_mails_owner_created_at` - Fast queries by owner
- `idx_mails_to_addresses_gin` - Fast queries on recipient arrays

## Security Model

1. **Owner Field**: Each email has an `owner` field set to the Keycloak user who sent it or received it
2. **Access Control**: Users can only access emails where:
   - `owner = their_username`, OR
   - Their username is in the `to_addresses` array
3. **Token Validation**: Keycloak middleware validates every request

## SMTP Receiver

The SMTP receiver listens on port **2525** and ingests incoming emails into the database.

- Parses email using `mailparser`
- Assigns `owner` to the first recipient (you can customize this logic)
- Stores in `INBOX` folder

## Docker Deployment (Optional)

Build the Docker image:

```bash
docker build -t pilot180-mail-backend .
```

Run with docker-compose (example):

```yaml
version: '3.8'
services:
  backend:
    image: pilot180-mail-backend
    ports:
      - "8081:8081"
      - "2525:2525"
    environment:
      PGHOST: postgres
      KEYCLOAK_URL: http://keycloak:8080/
      # ... other env vars
    depends_on:
      - postgres
      - keycloak
```

## Troubleshooting

### "Failed to fetch emails" in frontend

- Check that Keycloak is running and the backend can reach it
- Verify `KEYCLOAK_CLIENT_SECRET` is correct
- Check browser console for CORS or token errors

### Database connection errors

- Ensure PostgreSQL is running
- Verify credentials in `.env`
- Check that the database `pilot180mail` exists

### SMTP not receiving emails

- Verify port 2525 is not in use by another service
- Check firewall rules
- Test with `telnet localhost 2525`

## Development Tips

- Use **MailHog** (http://localhost:8025) to view sent emails
- Use **Keycloak Admin Console** to manage users and clients
- Enable `nodemon` for auto-restart during development

## License

MIT
