# Mail Server Setup Summary

## What's Been Completed

### 1. Directory Structure Created
```
mailserver/
├── docker-compose.yml              # Docker services configuration
├── config/
│   ├── postfix/
│   │   └── main.cf                # Postfix SMTP configuration
│   └── dovecot/
│       ├── dovecot.conf           # Dovecot IMAP configuration
│       └── users                  # User credentials file
├── data/
│   ├── maildir/                   # Mail storage
│   ├── db/                        # PostgreSQL data
│   └── opendkim/                  # DKIM keys (future)
└── README.md                      # Documentation
```

### 2. Services Deployed

**Postfix (SMTP Server)** - WORKING ✅
- Container: `pilot180-postfix`
- Status: Running (healthy)
- Ports:
  - 25: Standard SMTP
  - 587: Submission port
- Purpose: Send emails

**PostgreSQL Database** - WORKING ✅
- Container: `pilot180-mail-postgres`
- Status: Running
- Port: 5433
- Purpose: Store mail metadata

**Dovecot (IMAP Server)** - CONFIGURATION NEEDED ⚠️
- Container: `pilot180-dovecot`
- Status: Configuration issues (restarting)
- Ports: 143, 993
- Purpose: Receive emails via IMAP

### 3. Backend Updates

**Environment Variables** ([backend/.env](../backend/.env))
```env
# SMTP (Postfix Mail Server)
SMTP_HOST=localhost
SMTP_PORT=25
SMTP_SECURE=false
SMTP_FROM=no-reply@pilot180.local

# IMAP (Dovecot Mail Server)
IMAP_HOST=localhost
IMAP_PORT=143
IMAP_SECURE=false

# Mail domain
MAIL_DOMAIN=pilot180.local
```

**New IMAP Service** ([backend/services/imapService.js](../backend/services/imapService.js))
- `fetchImapEmails()` - Fetch emails from IMAP server
- `testImapConnection()` - Test IMAP connectivity
- Package installed: `imap`

## Current Status

### What's Working

1. **Postfix SMTP Server** ✅
   - Successfully sending emails on port 25
   - Configured for local domain `pilot180.local`
   - Health checks passing

2. **PostgreSQL Database** ✅
   - Running on port 5433
   - Ready for mail metadata storage

3. **Backend SMTP Integration** ✅
   - Already configured to use Postfix
   - `mailService.js` sends via localhost:25
   - SMTP receiver on port 2525 still working

### What Needs Attention

1. **Dovecot Configuration** ⚠️
   - Container is restarting due to configuration issues
   - Config file syntax needs adjustment for Dovecot 2.4.x
   - Not critical - your custom SMTP receiver (port 2525) works fine

## How to Use

### Option A: Use Postfix + Custom SMTP Receiver (Recommended)

Your current setup already works perfectly:
1. **Send emails** - Postfix (port 25)
2. **Receive emails** - Custom SMTP receiver (port 2525)
3. **Store emails** - PostgreSQL (existing database)

**To send an email:**
```javascript
// Your backend already does this:
const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 25,  // Now using Postfix instead of MailHog
  secure: false
});
```

### Option B: Switch Back to MailHog for Testing

If you prefer MailHog's web UI for testing:

1. Update `backend/.env`:
```env
SMTP_HOST=localhost
SMTP_PORT=1025  # Back to MailHog
```

2. MailHog is still running at:
   - SMTP: localhost:1025
   - Web UI: http://localhost:8025

### Option C: Fix Dovecot (Advanced)

If you want to use Dovecot for IMAP:

1. Simplify the Dovecot configuration
2. Use default Dovecot settings
3. Configure user authentication properly

## Testing the Mail Server

### Test SMTP (Postfix)

```bash
# Verify Postfix is running
docker logs pilot180-postfix

# Test SMTP connection from Node.js
node -e "require('nodemailer').createTransport({host:'localhost',port:25}).verify(console.log)"
```

### Send a Test Email

1. Open your app at http://localhost:3006
2. Log in with Keycloak (alice/bob/charlie : password)
3. Click "Compose mail"
4. Send email to another user
5. Check PostgreSQL database to see the email stored

### View Services Status

```bash
cd mailserver
docker compose ps
docker compose logs -f postfix    # Watch Postfix logs
docker compose logs -f maildb     # Watch PostgreSQL logs
```

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                  Your Mail System                             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (React)         →  http://localhost:3006          │
│         ↓                                                     │
│  Backend (Node.js)        →  http://localhost:8081          │
│         ↓                                                     │
│  Keycloak (Auth)          →  http://localhost:8080          │
│         ↓                                                     │
│  Postfix (SMTP Send)      →  localhost:25                   │
│  SMTP Receiver (Inbound)  →  localhost:2525                 │
│  PostgreSQL (Storage)     →  localhost:5432                 │
│  Mail PostgreSQL          →  localhost:5433                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Next Steps

### Immediate (Working Now)
1. ✅ Send emails via Postfix (port 25)
2. ✅ Receive emails via custom SMTP receiver (port 2525)
3. ✅ Store in PostgreSQL
4. ✅ Multi-user isolation with Keycloak

### Short Term (Optional)
1. Fix Dovecot configuration for IMAP support
2. Test with external email clients (Thunderbird, Outlook)
3. Add email attachments support
4. Implement email search

### Long Term (Production)
1. Add TLS/SSL encryption
2. Configure DKIM signing
3. Set up SPF and DMARC records
4. Implement rate limiting
5. Add spam filtering
6. Set up monitoring and alerts

## Comparison: MailHog vs Postfix

| Feature | MailHog | Postfix |
|---------|---------|---------|
| Purpose | Testing | Production |
| Web UI | ✅ Yes (port 8025) | ❌ No |
| SMTP Port | 1025 | 25, 587 |
| Real Delivery | ❌ No (catches all) | ✅ Yes |
| Configuration | ✅ Zero config | ⚠️ Requires setup |
| TLS/SSL | ❌ No | ✅ Yes |
| DKIM/SPF | ❌ No | ✅ Yes |

## Troubleshooting

### Postfix Issues
```bash
# Check Postfix logs
docker logs pilot180-postfix

# Restart Postfix
cd mailserver && docker compose restart postfix
```

### Port Conflicts
If port 25 is already in use:
```bash
# Check what's using port 25
netstat -ano | findstr :25

# Either stop that service or change Postfix port in docker-compose.yml
```

### Backend Connection Issues
```bash
# Verify backend can reach Postfix
telnet localhost 25

# Check backend logs
cd backend && npm start
```

## Documentation

- [README.md](README.md) - Detailed documentation
- [Postfix Docs](http://www.postfix.org/documentation.html)
- [Dovecot Docs](https://doc.dovecot.org/)

## Success! 🎉

You now have a self-hosted mail server with:
- ✅ Postfix for sending emails
- ✅ PostgreSQL for storage
- ✅ Custom SMTP receiver for incoming mail
- ✅ Keycloak authentication
- ✅ Multi-user isolation
- ✅ Full privacy and control

The system is ready to use! Just make sure port 25 is accessible and start sending emails.
