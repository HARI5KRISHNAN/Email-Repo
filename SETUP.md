# Multi-User Mailbox Setup Guide

Complete setup instructions for the Pilot180 multi-user mail system with Keycloak authentication.

## System Overview

This project implements a complete email system with:

- **Frontend**: React + TypeScript + Vite mail UI
- **Backend**: Express.js REST API with Keycloak authentication
- **Database**: PostgreSQL with per-user mail isolation
- **Auth**: Keycloak for identity management
- **SMTP**: Incoming/outgoing mail handling

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌──────────────┐
│   Browser   │─────▶│   Frontend   │─────▶│   Keycloak   │
│             │      │ (React/Vite) │      │    (Auth)    │
└─────────────┘      └──────────────┘      └──────────────┘
                            │                       │
                            ▼                       │
                     ┌──────────────┐              │
                     │   Backend    │◀─────────────┘
                     │  (Express)   │
                     └──────────────┘
                            │
                     ┌──────┴──────┐
                     ▼             ▼
              ┌──────────┐  ┌──────────┐
              │PostgreSQL│  │ MailHog  │
              │   (DB)   │  │  (SMTP)  │
              └──────────┘  └──────────┘
```

## Prerequisites

Install the following:

1. **Node.js** v18+ and npm
2. **PostgreSQL** v14+
3. **Docker** and Docker Compose (recommended for Keycloak + MailHog)

## Step 1: Set Up Services with Docker

Create a `docker-compose.yml` in the project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: pilot180-postgres
    environment:
      POSTGRES_DB: pilot180mail
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  keycloak:
    image: quay.io/keycloak/keycloak:23.0
    container_name: pilot180-keycloak
    command: start-dev
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
      KC_DB: postgres
      KC_DB_URL: jdbc:postgresql://postgres:5432/keycloak
      KC_DB_USERNAME: postgres
      KC_DB_PASSWORD: postgres
      KC_HOSTNAME_STRICT: false
      KC_HTTP_ENABLED: true
    ports:
      - "8080:8080"
    depends_on:
      - postgres

  mailhog:
    image: mailhog/mailhog:latest
    container_name: pilot180-mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI

volumes:
  postgres_data:
```

Start the services:

```bash
docker-compose up -d
```

Wait for services to be ready:
- Keycloak: http://localhost:8080 (admin/admin)
- MailHog UI: http://localhost:8025
- PostgreSQL: localhost:5432

## Step 2: Configure Keycloak

### Create Realm

1. Go to http://localhost:8080
2. Login with `admin` / `admin`
3. Hover over **Master** realm → **Create Realm**
4. Name: `pilot180`
5. Click **Create**

### Create Frontend Client

1. Go to **Clients** → **Create client**
2. Set:
   - **Client ID**: `ai-email-assistant`
   - **Client Type**: `OpenID Connect`
3. Click **Next**
4. Set:
   - **Client authentication**: OFF (public client)
   - **Authorization**: OFF
   - **Standard flow**: ON
   - **Direct access grants**: ON
5. Click **Next**
6. Set **Valid redirect URIs**:
   - `http://localhost:5173/*`
   - `http://localhost:3006/*`
   - (add your frontend port)
7. Set **Web origins**: `*` (or specific domain)
8. Click **Save**

### Create Backend Client

1. Go to **Clients** → **Create client**
2. Set:
   - **Client ID**: `mail-backend`
   - **Client Type**: `OpenID Connect`
3. Click **Next**
4. Set:
   - **Client authentication**: ON (confidential)
   - **Authorization**: OFF
   - **Service accounts roles**: ON
5. Click **Next**
6. Set **Valid redirect URIs**: `http://localhost:8081/*`
7. Click **Save**
8. Go to **Credentials** tab
9. Copy the **Client Secret** (you'll need this for backend `.env`)

### Create Test Users

1. Go to **Users** → **Add user**
2. Create users like:
   - Username: `alice`
   - Email: `alice@pilot180.local`
   - Email verified: ON
3. Click **Create**
4. Go to **Credentials** tab → **Set password**
5. Set password (e.g., `password123`)
6. Turn OFF **Temporary**
7. Repeat for more users (e.g., `bob`, `charlie`)

## Step 3: Set Up Database

Run the migration to create the `mails` table:

```bash
# Option 1: Using psql
psql -h localhost -U postgres -d pilot180mail -f backend/migrations/001_create_mails.sql

# Option 2: Using Docker exec
docker exec -i pilot180-postgres psql -U postgres -d pilot180mail < backend/migrations/001_create_mails.sql
```

Verify the table was created:

```bash
psql -h localhost -U postgres -d pilot180mail -c "\dt"
```

You should see the `mails` table listed.

## Step 4: Configure Backend

### Install Dependencies

```bash
cd backend
npm install
```

### Create Environment File

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=8081

# Postgres
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=postgres
PGDATABASE=pilot180mail

# Keycloak
KEYCLOAK_URL=http://localhost:8080/
KEYCLOAK_REALM=pilot180
KEYCLOAK_CLIENT_ID=mail-backend
KEYCLOAK_CLIENT_SECRET=<paste_secret_from_keycloak_here>

# SMTP (MailHog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_FROM=no-reply@pilot180.local

# SMTP receiver port
SMTP_RECEIVER_PORT=2525

# Session
SESSION_SECRET=change_this_to_random_string
```

### Start Backend

```bash
npm start
```

Or with auto-reload for development:

```bash
npm run dev
```

You should see:
```
Keycloak initialized
Mail backend listening on 8081
SMTP receiver listening on 2525
```

## Step 5: Configure Frontend

The frontend `.env` should already exist. Verify it contains:

```env
VITE_KEYCLOAK_URL=http://localhost:8080/
VITE_KEYCLOAK_REALM=pilot180
VITE_KEYCLOAK_CLIENT_ID=ai-email-assistant
VITE_API_BASE=http://localhost:8081/api
```

### Install Dependencies

```bash
# From project root
npm install
```

### Start Frontend

```bash
npm run dev
```

The frontend should start on http://localhost:5173 (or your configured port).

## Step 6: Test the System

### Test Login

1. Open http://localhost:5173 in your browser
2. You should be redirected to Keycloak login
3. Login with `alice` / `password123`
4. You should be redirected back to the mail UI

### Test Sending Email

1. Create a Compose component or use the API directly
2. Send an email from `alice` to `bob@pilot180.local`
3. Check MailHog UI at http://localhost:8025 to see the sent email

### Test Receiving Email

You can test the SMTP receiver:

```bash
# Send a test email to the SMTP receiver
telnet localhost 2525
EHLO localhost
MAIL FROM: external@example.com
RCPT TO: alice@pilot180.local
DATA
Subject: Test Email
From: external@example.com
To: alice@pilot180.local

This is a test email.
.
QUIT
```

Then check the database:

```bash
psql -h localhost -U postgres -d pilot180mail -c "SELECT * FROM mails;"
```

### Test Multi-User Isolation

1. Login as `alice` - you should only see emails where:
   - `owner = 'alice'`, OR
   - `alice@pilot180.local` is in `to_addresses`

2. Logout and login as `bob` - you should only see `bob`'s emails

3. Emails sent by `alice` should not appear in `bob`'s inbox unless `bob` is a recipient

## Step 7: Add Compose UI to Frontend (Optional)

To add a compose button to your UI, update [Header.tsx](components/Header.tsx):

```tsx
import { useState } from 'react';
import Compose from './Compose';

export default function Header() {
  const [showCompose, setShowCompose] = useState(false);

  return (
    <>
      <header>
        {/* ... existing header content ... */}
        <button onClick={() => setShowCompose(true)}>
          Compose
        </button>
      </header>

      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Compose onClose={() => setShowCompose(false)} />
        </div>
      )}
    </>
  );
}
```

## Troubleshooting

### Frontend shows "Connecting to authentication..."

- Check that Keycloak is running on port 8080
- Verify `.env` has correct `VITE_KEYCLOAK_URL`
- Check browser console for errors

### Backend errors "Failed to connect to database"

- Ensure PostgreSQL is running
- Verify `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD` in backend `.env`
- Try connecting manually: `psql -h localhost -U postgres -d pilot180mail`

### 401 Unauthorized errors

- Verify backend `KEYCLOAK_CLIENT_SECRET` is correct
- Check that the backend client is configured as **confidential** in Keycloak
- Ensure frontend is using the correct `KEYCLOAK_CLIENT_ID`

### CORS errors

- Add frontend origin to backend CORS config
- Check Keycloak client's **Web Origins** setting

### Emails not appearing in inbox

- Check database: `SELECT * FROM mails;`
- Verify `owner` field matches the logged-in username
- Check backend logs for errors

## Next Steps

### Production Deployment

1. Use a real PostgreSQL instance (not Docker dev setup)
2. Configure Keycloak with proper SSL/TLS
3. Use environment-specific secrets
4. Set up proper SMTP relay (not MailHog)
5. Configure firewall rules for ports 8081, 2525

### Optional Enhancements

- Add file attachments support
- Implement email folders (draft, trash, archive)
- Add real-time notifications via WebSocket
- Implement email search with full-text indexes
- Add email threading logic
- Integrate AI assistant features

## Architecture Notes

### Per-User Isolation

- The `owner` field in the `mails` table stores the Keycloak username or email
- Backend routes filter queries by `owner = current_user OR current_user IN to_addresses`
- This ensures users can only access their own emails

### Token Flow

1. Frontend gets token from Keycloak
2. Frontend includes token in `Authorization: Bearer <token>` header
3. Backend validates token via Keycloak middleware
4. Backend extracts username from token and uses it to filter database queries

### SMTP Receiver

- Listens on port 2525 for incoming emails
- Parses emails and stores in database
- Assigns `owner` heuristically (first recipient) - customize as needed

## License

MIT
