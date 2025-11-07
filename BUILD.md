# Single-Click Docker Build Instructions

## Prerequisites
- Docker Desktop installed and running
- Git (to pull the latest changes)

## Build and Start Everything (Single Command)

From the project root directory, run:

```bash
docker-compose up -d --build
```

This will:
1. Build all Docker images from scratch
2. Start all services (PostgreSQL, Keycloak, Postfix, Dovecot, MailHog, Backend)
3. Automatically run database migrations
4. Start the backend API on port 8081

## Check Status

```bash
docker-compose ps
```

All services should show status as "Up (healthy)".

## View Logs

```bash
# All services
docker-compose logs -f

# Just backend
docker-compose logs -f backend
```

## Stop Everything

```bash
docker-compose down
```

## Clean Rebuild (if you have issues)

```bash
# Stop and remove everything
docker-compose down -v

# Rebuild and start
docker-compose up -d --build
```

## Service Ports

- **Backend API**: http://localhost:8081
- **Keycloak**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **MailHog Web UI**: http://localhost:8025
- **Postfix SMTP**: localhost:25
- **Dovecot IMAP**: localhost:143

## Frontend Setup

The frontend runs separately. In another terminal:

```bash
cd frontend  # or wherever your React app is
npm install
npm start
```

## Troubleshooting

### Port Conflicts

If you get "port already in use" errors:

1. Check what's using the ports:
   ```bash
   # Windows PowerShell
   Get-NetTCPConnection -LocalPort 8081 | Select-Object OwningProcess

   # Mac/Linux
   lsof -i :8081
   ```

2. Kill the process or change the port in `docker-compose.yml`

### Backend Not Starting

Check the logs:
```bash
docker-compose logs backend
```

Common issues:
- PostgreSQL not ready: Wait 30 seconds and check again
- Migration errors: The migrations run automatically, check logs for SQL errors

### Draft Functionality Not Working

1. Ensure backend is running: `curl http://localhost:8081/health`
2. Check migrations ran: `docker-compose logs backend | grep migration`
3. Verify drafts table exists:
   ```bash
   docker exec -it pilot180-postgres psql -U postgres -d pilot180mail -c "\dt drafts"
   ```

## What's Included in This Build

### Backend Features
- ✅ Email inbox/sent/spam/trash management
- ✅ Star/unread functionality
- ✅ Folder counts
- ✅ **Draft saving and management**
- ✅ Calendar and meeting scheduling
- ✅ Meeting details popup
- ✅ Email compose with draft auto-save
- ✅ Reply/Forward with draft auto-save

### Database
- ✅ Auto-migrations on startup
- ✅ Drafts table
- ✅ Meetings table
- ✅ Mail table with all fields

### Services
- ✅ PostgreSQL database
- ✅ Keycloak authentication
- ✅ Postfix (SMTP server)
- ✅ Dovecot (IMAP server)
- ✅ MailHog (email testing)

## Development Workflow

### Making Backend Changes

1. Edit code in `backend/`
2. Rebuild and restart:
   ```bash
   docker-compose up -d --build backend
   ```

### Adding New Migrations

1. Create new file: `backend/migrations/010_your_migration.sql`
2. Rebuild backend:
   ```bash
   docker-compose up -d --build backend
   ```
3. Migrations run automatically on startup

### Viewing Database

```bash
# Connect to PostgreSQL
docker exec -it pilot180-postgres psql -U postgres -d pilot180mail

# View tables
\dt

# View drafts
SELECT * FROM drafts;

# Exit
\q
```
