# Quick Start Guide - 5 Minutes

Get the multi-user mailbox running in 5 minutes!

## Prerequisites

- Node.js v18+
- Docker and Docker Compose
- psql (PostgreSQL client)

## Step 1: Start Services (1 min)

```bash
# Start PostgreSQL, Keycloak, and MailHog
docker-compose up -d

# Wait 30 seconds for services to initialize
```

## Step 2: Set Up Database (30 sec)

```bash
# Create the mails table
psql -h localhost -U postgres -d pilot180mail -f backend/migrations/001_create_mails.sql

# Password: postgres
```

## Step 3: Configure Keycloak (2 min)

Open http://localhost:8080 and login with `admin` / `admin`

### Create Realm
1. Hover **Master** → **Create Realm** → Name: `pilot180` → **Create**

### Create Frontend Client
1. **Clients** → **Create client**
2. Client ID: `ai-email-assistant` → **Next**
3. Client authentication: **OFF** → **Next**
4. Valid redirect URIs: `http://localhost:5173/*` → **Save**

### Create Backend Client
1. **Clients** → **Create client**
2. Client ID: `mail-backend` → **Next**
3. Client authentication: **ON** → **Next**
4. Valid redirect URIs: `http://localhost:8081/*` → **Save**
5. **Credentials** tab → Copy **Client Secret**

### Create Users
1. **Users** → **Add user**
2. Username: `alice`, Email: `alice@pilot180.local`, Email verified: **ON** → **Create**
3. **Credentials** tab → Set password: `password123`, Temporary: **OFF** → **Save**
4. Repeat for `bob` and `charlie`

## Step 4: Configure Backend (30 sec)

Edit `backend/.env` and paste the client secret:

```bash
# Change this line:
KEYCLOAK_CLIENT_SECRET=replace_with_your_secret_from_keycloak

# To:
KEYCLOAK_CLIENT_SECRET=<paste_secret_here>
```

## Step 5: Start Backend (30 sec)

```bash
cd backend
npm install
npm start
```

You should see:
```
Keycloak initialized
Mail backend listening on 8081
SMTP receiver listening on 2525
```

## Step 6: Start Frontend (30 sec)

Open a new terminal:

```bash
# From project root
npm install
npm run dev
```

## Step 7: Test! (30 sec)

1. Open http://localhost:5173
2. Login with `alice` / `password123`
3. You should see the mail UI!

## Send a Test Email

```bash
curl -X POST http://localhost:8081/api/mail/send \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["bob@pilot180.local"],
    "subject": "Test Email",
    "text": "Hello from Alice!"
  }'
```

Or use the Compose component in the UI!

## View Sent Emails

Check MailHog UI: http://localhost:8025

## Troubleshooting

### Can't connect to database
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# If not running, start it
docker-compose up -d postgres
```

### Keycloak not accessible
```bash
# Check Keycloak is running
docker ps | grep keycloak

# Check logs
docker logs pilot180-keycloak
```

### Backend can't start
- Verify `backend/.env` has correct `KEYCLOAK_CLIENT_SECRET`
- Check port 8081 is not in use
- Review backend logs for errors

### Frontend shows "Connecting to authentication..."
- Verify `.env` in project root has correct Keycloak URL
- Check browser console for errors
- Ensure Keycloak realm `pilot180` exists

## What's Running?

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8081
- **Keycloak**: http://localhost:8080 (admin/admin)
- **MailHog UI**: http://localhost:8025
- **PostgreSQL**: localhost:5432 (postgres/postgres)
- **SMTP Receiver**: localhost:2525

## Test Multi-User Isolation

1. Login as `alice` → Send email to `bob@pilot180.local`
2. Logout (or open incognito window)
3. Login as `bob` → You should see alice's email
4. Login as `charlie` → You should NOT see the email (not a recipient)

## Stop Everything

```bash
# Stop Docker services
docker-compose down

# Stop backend (Ctrl+C in backend terminal)
# Stop frontend (Ctrl+C in frontend terminal)
```

## Next Steps

- Read [SETUP.md](SETUP.md) for detailed documentation
- Read [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for architecture details
- Check [backend/README.md](backend/README.md) for API docs

## Common Ports Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Backend API | 8081 | http://localhost:8081 |
| Keycloak | 8080 | http://localhost:8080 |
| MailHog Web | 8025 | http://localhost:8025 |
| MailHog SMTP | 1025 | localhost:1025 |
| SMTP Receiver | 2525 | localhost:2525 |
| PostgreSQL | 5432 | localhost:5432 |

Happy coding!
