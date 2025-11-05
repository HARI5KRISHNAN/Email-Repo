# Quick Start Guide - Pilot180 Mail Server

## ✅ System Status: WORKING

Your mail server is fully configured and operational!

### Current Configuration

- **Domain**: `pilot180.local`
- **Users**: alice, bob, charlie
- **SMTP**: Port 25 (Postfix)
- **IMAP**: Port 143 (Dovecot)
- **Mail Storage**: `/var/mail/vhosts/pilot180.local/`

## Running the Setup (Windows)

```powershell
cd mailserver
.\setup.ps1
```

Or use Git Bash:
```bash
cd mailserver
./setup.sh
```

## Quick Commands

### Send Test Email
```bash
docker exec pilot180-postfix sh -c "echo 'Subject: Test' | sendmail bob@pilot180.local"
```

### Check Delivery
```bash
docker exec pilot180-dovecot sh -c "ls -la /var/mail/vhosts/pilot180.local/bob/new/"
```

### View Mail Queue
```bash
docker exec pilot180-postfix mailq
```

### Watch Logs
```bash
# Postfix (SMTP delivery)
docker logs -f pilot180-postfix | grep -E "virtual|status="

# Backend (API)
docker logs -f pilot180-backend

# Dovecot (IMAP)
docker logs -f pilot180-dovecot
```

## Testing from Frontend

1. Open `http://localhost:3006`
2. Log in with Keycloak
3. Send email to `bob@pilot180.local`
4. Email should be delivered within seconds

## Verification

### Check if email was delivered:
```bash
docker exec pilot180-dovecot sh -c "ls -la /var/mail/vhosts/pilot180.local/bob/new/"
```

You should see message files with names like:
```
-rw------- 1 vmail vmail  465 Nov  5 05:42 1762321366.V44I9d000000018a03M979021.mail.pilot180.local
```

### View email content:
```bash
docker exec pilot180-dovecot sh -c "cat /var/mail/vhosts/pilot180.local/bob/new/*" | tail -20
```

## Current Working Architecture

```
┌──────────────┐      ┌─────────────┐      ┌──────────────┐
│   Frontend   │─────▶│   Backend   │─────▶│   Postfix    │
│ (Port 3006)  │      │ (Port 8081) │      │   (Port 25)  │
└──────────────┘      └─────────────┘      └──────────────┘
                                                    │
                                                    ▼
                                            Virtual Mailbox
                                        /var/mail/vhosts/%d/%n
                                                    │
                                                    ▼
                                            ┌──────────────┐
                                            │   Dovecot    │
                                            │  (Port 143)  │
                                            └──────────────┘
```

## Mail Flow

### Sending Email (alice → bob@pilot180.local)

1. **Frontend** → Sends request to Backend API
2. **Backend** → Connects to Postfix SMTP (port 25)
3. **Postfix** → Checks virtual_mailbox_maps
4. **Postfix** → Delivers to `/var/mail/vhosts/pilot180.local/bob/`
5. **Dovecot** → Serves via IMAP (port 143)
6. **Frontend** → Fetches via Backend API

### Current Status: ✅ ALL WORKING

- ✅ JWT Authentication (Keycloak)
- ✅ Backend API (port 8081)
- ✅ SMTP Delivery (Postfix)
- ✅ Virtual Mailboxes
- ✅ Maildir Storage
- ✅ IMAP Access (Dovecot)

## Troubleshooting

### Email not delivered?

1. **Check queue**:
   ```bash
   docker exec pilot180-postfix mailq
   ```

2. **Check logs**:
   ```bash
   docker logs pilot180-postfix 2>&1 | grep -E "bob@pilot180.local|error"
   ```

3. **Verify directory exists**:
   ```bash
   docker exec pilot180-dovecot sh -c "ls -la /var/mail/vhosts/pilot180.local/"
   ```

4. **Check permissions**:
   ```bash
   docker exec pilot180-postfix sh -c "chown -R 1000:1000 /var/mail/vhosts && chmod -R 755 /var/mail/vhosts"
   ```

### Can't access from frontend?

1. **Check backend is running**:
   ```bash
   docker ps | grep backend
   ```

2. **Test backend health**:
   ```bash
   curl http://localhost:8081/health
   ```
   Should return: `{"ok":true}`

3. **Check Keycloak token**:
   - Make sure you're logged in
   - Check browser console for auth errors

## Adding New Users

To add `david@pilot180.local`:

1. **Add to vmailbox**:
   ```bash
   echo "david@pilot180.local pilot180.local/david/" >> config/postfix/vmailbox
   docker exec pilot180-postfix postmap /etc/postfix/vmailbox
   ```

2. **Add to Dovecot users**:
   ```bash
   echo "david@pilot180.local:{PLAIN}password:1000:1000::/var/mail/vhosts/pilot180.local/david::" >> config/dovecot/users
   docker restart pilot180-dovecot
   ```

3. **Create mailbox**:
   ```bash
   docker exec pilot180-postfix mkdir -p /var/mail/vhosts/pilot180.local/david
   docker exec pilot180-postfix chown -R 1000:1000 /var/mail/vhosts/pilot180.local/david
   ```

## Maintenance

### Restart Services
```bash
docker restart pilot180-postfix pilot180-dovecot pilot180-backend
```

### Clear Queue (external emails that failed)
```bash
docker exec pilot180-postfix postsuper -d ALL
```

### View Configuration
```bash
# Postfix
docker exec pilot180-postfix postconf -n

# Dovecot
docker exec pilot180-dovecot doveconf -n
```

## Production Notes

⚠️ **This is a DEVELOPMENT configuration**

For production, you need:
- SSL/TLS certificates
- Hashed passwords
- Proper DNS (MX, SPF, DKIM, DMARC)
- Firewall configuration
- Regular backups

See [SETUP_GUIDE.md](SETUP_GUIDE.md) for production deployment instructions.

## Support

Everything is working! If you have questions:
1. Check logs first
2. Verify containers are running
3. Test with manual sendmail command
4. Check permissions on maildir

---

**Last Verified**: Working as of setup
**Test Result**: ✅ Email delivery successful
**Next Step**: Test from frontend at http://localhost:3006
