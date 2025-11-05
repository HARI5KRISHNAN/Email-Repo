# Self-Hosted Mail Server Setup

This directory contains the configuration for a full self-hosted mail server using Postfix (SMTP) and Dovecot (IMAP).

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Mail Server Stack                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Postfix (SMTP)         Dovecot (IMAP)      PostgreSQL       │
│  Port 25, 587          Port 143, 993        Port 5433        │
│                                                               │
│  → Send emails         → Receive emails     → Mail metadata  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Services

1. **Postfix** - SMTP server for sending emails
   - Port 25: Standard SMTP
   - Port 587: Submission port

2. **Dovecot** - IMAP server for receiving emails
   - Port 143: IMAP (unencrypted for local development)
   - Port 993: IMAPS (TLS, disabled for now)

3. **PostgreSQL** - Database for mail metadata
   - Port 5433: PostgreSQL database

## Quick Start

### 1. Start the mail server

```bash
cd mailserver
docker compose up -d
```

### 2. Verify services are running

```bash
docker compose ps
```

You should see:
- `pilot180-postfix` (running)
- `pilot180-dovecot` (running)
- `pilot180-mail-postgres` (running)

### 3. Check logs

```bash
# Postfix logs
docker logs pilot180-postfix

# Dovecot logs
docker logs pilot180-dovecot

# PostgreSQL logs
docker logs pilot180-mail-postgres
```

### 4. Test SMTP connection

```bash
# From your backend directory
node -e "require('nodemailer').createTransport({host:'localhost',port:25}).verify(console.log)"
```

## Configuration Files

### Postfix Configuration
- `config/postfix/main.cf` - Main Postfix configuration
  - Domain: `pilot180.local`
  - Hostname: `mail.pilot180.local`

### Dovecot Configuration
- `config/dovecot/dovecot.conf` - Main Dovecot configuration
- `config/dovecot/users` - User credentials (plain text for development)

Default users:
- `alice:password`
- `bob:password`
- `charlie:password`

## Sending Emails

Your backend is already configured to send emails via Postfix. The `mailService.js` uses:

```javascript
SMTP_HOST=localhost
SMTP_PORT=25
```

## Receiving Emails

There are two ways to receive emails:

### Option 1: SMTP Receiver (Current Implementation)
Your backend has a custom SMTP receiver on port 2525 that captures incoming emails and stores them directly in PostgreSQL.

### Option 2: IMAP Sync (New)
Use the new `imapService.js` to fetch emails from Dovecot via IMAP. This is useful if you want to:
- Sync with external mail servers
- Support multiple mail clients
- Use standard IMAP protocol

## Switching Between MailHog and Postfix

### Use Postfix (Production-like):
```env
SMTP_HOST=localhost
SMTP_PORT=25
```

### Use MailHog (Testing):
```env
SMTP_HOST=localhost
SMTP_PORT=1025
```

## Directory Structure

```
mailserver/
├── docker-compose.yml          # Docker services configuration
├── config/
│   ├── postfix/
│   │   └── main.cf            # Postfix main configuration
│   └── dovecot/
│       ├── dovecot.conf       # Dovecot main configuration
│       └── users              # User credentials
├── data/
│   ├── maildir/               # Mail storage (Maildir format)
│   ├── db/                    # PostgreSQL data
│   └── opendkim/              # DKIM keys (future)
└── README.md                  # This file
```

## Troubleshooting

### Port 25 already in use
Some systems have a local mail server running. Either:
1. Stop the local mail server
2. Change Postfix to use a different port (e.g., 2525)

### Cannot connect to Dovecot
Check that the Dovecot container is running:
```bash
docker logs pilot180-dovecot
```

### Emails not being delivered
1. Check Postfix logs: `docker logs pilot180-postfix`
2. Verify SMTP configuration in backend/.env
3. Test SMTP connection with nodemailer

## Security Notes

**⚠️ This configuration is for DEVELOPMENT ONLY**

For production use, you should:
1. Enable TLS/SSL for SMTP and IMAP
2. Use encrypted passwords (not plain text)
3. Configure SPF, DKIM, and DMARC
4. Set up firewall rules
5. Use proper domain names (not .local)
6. Implement rate limiting
7. Enable authentication for SMTP

## Next Steps

1. **Add DKIM signing** - Sign outgoing emails
2. **Enable TLS** - Encrypt connections
3. **Add SPF records** - Prevent spoofing
4. **Set up DMARC** - Email authentication
5. **Configure relay** - Send emails to external domains

## Resources

- [Postfix Documentation](http://www.postfix.org/documentation.html)
- [Dovecot Documentation](https://doc.dovecot.org/)
- [Docker Compose](https://docs.docker.com/compose/)
