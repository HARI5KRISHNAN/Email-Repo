# 📧 Pilot180 Email System

A complete, self-hosted email system with web UI, built with React, Node.js, Postfix, Dovecot, and Keycloak authentication.

## ✨ Features

- 📨 Send and receive emails
- 📥 Inbox and Sent folders
- 🔐 Keycloak authentication (SSO ready)
- 👥 Multi-user support
- 🎨 Modern, responsive UI
- 🐳 Fully containerized with Docker
- 🚀 One-command startup

## 🚀 Quick Start (Plug & Play)

### Prerequisites

- Docker Desktop (or Docker + Docker Compose)
- Git
- Node.js (for frontend development)

### One-Command Setup

```bash
# Clone the repository
git clone https://github.com/HARI5KRISHNAN/Email-Repo.git
cd Email-Repo

# Make startup script executable
chmod +x start.sh

# Start everything!
./start.sh
```

That's it! The script will:
- ✅ Build all Docker images
- ✅ Start all services (Postgres, Keycloak, Postfix, Dovecot, Backend)
- ✅ Run database migrations automatically
- ✅ Configure Keycloak realm and users
- ✅ Initialize mail system
- ✅ Send test emails

The entire setup takes about 2 minutes.

### Start the Frontend

```bash
# Install dependencies and start
npm install
npm run dev
```

### Access the Application

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 (or 3006, 3007) | See test users below |
| Backend API | http://localhost:8081 | N/A |
| Keycloak Admin | http://localhost:8080/admin | admin / admin |
| MailHog | http://localhost:8025 | N/A |

### 👤 Test Users

All test users have the password: `password`

- **alice@pilot180.local** - Alice Smith
- **bob@pilot180.local** - Bob Johnson
- **charlie@pilot180.local** - Charlie Brown

## 📁 Project Structure

```
Email-Repo/
├── backend/                 # Node.js backend (Express + IMAP/SMTP)
│   ├── migrations/         # Database migrations (auto-run)
│   ├── services/           # Email services (IMAP, SMTP, DB)
│   ├── routes/             # API routes
│   └── docker-entrypoint.sh # Auto-runs migrations on startup
├── mailserver/             # Mail server configuration
│   ├── config/
│   │   ├── postfix/       # Postfix config
│   │   └── dovecot/       # Dovecot config
│   └── init-postfix.sh    # Postfix initialization
├── keycloak/              # Keycloak realm configuration
│   └── pilot180-realm.json # Pre-configured realm with users
├── App.tsx                # Main React component
├── docker-compose.yml     # All services defined here
└── start.sh              # One-command startup script
```

## 🛠️ Useful Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker logs -f pilot180-backend
docker logs -f pilot180-postfix
```

### Check Service Health
```bash
docker-compose ps
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Stop Everything
```bash
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

### Send Test Email
```bash
docker exec pilot180-postfix sendmail alice@pilot180.local <<EOF
Subject: Test Email
From: bob@pilot180.local

This is a test email!
EOF
```

## 🐛 Troubleshooting

### Backend not starting?
```bash
docker logs pilot180-backend
# Check if migrations ran successfully
```

### No emails appearing?
```bash
# Check Postfix logs
docker logs pilot180-postfix | tail -50

# Check Dovecot logs
docker logs pilot180-dovecot | tail -50

# Verify mailbox exists
docker exec pilot180-dovecot ls -la /var/mail/vhosts/pilot180.local/bob/
```

### Can't login to frontend?
```bash
# Check Keycloak is running
curl http://localhost:8080/health

# Verify realm was imported
docker logs pilot180-keycloak | grep "pilot180"
```

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐
│   Browser   │────────▶│   Keycloak   │
│  (React UI) │◀────────│ (Auth/Users) │
└──────┬──────┘         └──────────────┘
       │
       │ REST API
       ▼
┌──────────────┐
│   Backend    │
│  (Node.js)   │
└───┬──────┬───┘
    │      │
    │      └─────────┐
    ▼                ▼
┌─────────┐    ┌────────────┐
│PostgreSQL│    │   Dovecot  │
│  (DB)   │    │   (IMAP)   │
└─────────┘    └─────┬──────┘
                     │
                     ▼
               ┌────────────┐
               │  Postfix   │
               │  (SMTP)    │
               └────────────┘
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `./start.sh`
5. Submit a pull request

## 📄 License

MIT License

---

**Need help?** Open an issue on GitHub!
