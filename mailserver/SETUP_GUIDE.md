# Pilot180 Mail Server - Complete Setup Guide

## System Overview

This guide covers the complete setup of a working mail server with:
- **Postfix**: SMTP server (sending/receiving mail)
- **Dovecot**: IMAP server (accessing mailboxes)
- **OpenDKIM**: Email signing and verification
- **Backend Integration**: Keycloak-authenticated API

## Current Working Configuration

### Service Status
```
✅ pilot180-backend      Up on port 8081
✅ pilot180-postgres     Up (healthy)
✅ pilot180-keycloak     Up on port 8080
✅ pilot180-postfix      Up (healthy) on port 25
✅ pilot180-dovecot      Up on port 143
```

## Initial Setup

### 1. Start All Services

```bash
# Start main services
cd /path/to/mailbox-ui-clone
docker-compose up -d

# Start mail server
cd mailserver
docker-compose up -d
```

### 2. Initialize Postfix Virtual Mailboxes

```bash
# Create virtual mailbox database
docker exec pilot180-postfix postmap /etc/postfix/vmailbox

# Reload Postfix
docker exec pilot180-postfix postfix reload

# Verify configuration
docker exec pilot180-postfix postconf virtual_mailbox_domains virtual_mailbox_maps
```

Expected output:
```
virtual_mailbox_domains = pilot180.local
virtual_mailbox_maps = lmdb:/etc/postfix/vmailbox
```

### 3. Create Mailbox Directories

```bash
# Create directories for all users
docker exec pilot180-postfix sh -c "
  mkdir -p /var/mail/vhosts/pilot180.local/alice &&
  mkdir -p /var/mail/vhosts/pilot180.local/bob &&
  mkdir -p /var/mail/vhosts/pilot180.local/charlie &&
  chown -R 1000:1000 /var/mail/vhosts &&
  chmod -R 755 /var/mail/vhosts
"

# Verify directories
docker exec pilot180-postfix ls -la /var/mail/vhosts/pilot180.local/
```

### 4. Verify Dovecot Configuration

```bash
# Check Dovecot is running
docker ps | grep dovecot

# View configuration
docker exec pilot180-dovecot doveconf -n | grep -E "mail_location|protocols"
```

## Testing the Setup

### Test 1: Internal Mail Delivery

Send an email from the Postfix container:

```bash
docker exec pilot180-postfix sh -c "
echo 'Subject: Test Email

This is a test from Postfix.' | sendmail bob@pilot180.local
"

# Wait 2-3 seconds, then check if delivered
docker exec pilot180-dovecot ls -la /var/mail/vhosts/pilot180.local/bob/new/
```

You should see a message file created.

### Test 2: Backend API

From your frontend at `http://localhost:3006`:

1. Log in with Keycloak credentials
2. Send email to `bob@pilot180.local`
3. Monitor logs:
   ```bash
   docker logs -f pilot180-backend
   docker logs -f pilot180-postfix | grep virtual
   ```

### Test 3: Check Mail Queue

```bash
# View queue
docker exec pilot180-postfix mailq

# Empty queue means all delivered successfully
```

## Configuration Files Reference

### Postfix Main Configuration

File: `config/postfix/main.cf`

Key settings:
```conf
virtual_mailbox_domains = pilot180.local
virtual_mailbox_base = /var/mail/vhosts
virtual_mailbox_maps = lmdb:/etc/postfix/vmailbox
message_size_limit = 51200000
```

### Virtual Mailbox Mappings

File: `config/postfix/vmailbox`

```
alice@pilot180.local pilot180.local/alice/
bob@pilot180.local pilot180.local/bob/
charlie@pilot180.local pilot180.local/charlie/
```

### Dovecot User Database

File: `config/dovecot/users`

```
alice@pilot180.local:{PLAIN}password:1000:1000::/var/mail/vhosts/pilot180.local/alice::
bob@pilot180.local:{PLAIN}password:1000:1000::/var/mail/vhosts/pilot180.local/bob::
charlie@pilot180.local:{PLAIN}password:1000:1000::/var/mail/vhosts/pilot180.local/charlie::
```

## Adding New Users

To add a new user (e.g., `david@pilot180.local`):

1. **Add to Postfix virtual mailbox**:
   ```bash
   echo "david@pilot180.local pilot180.local/david/" >> mailserver/config/postfix/vmailbox
   docker exec pilot180-postfix postmap /etc/postfix/vmailbox
   ```

2. **Add to Dovecot users**:
   ```bash
   echo "david@pilot180.local:{PLAIN}password:1000:1000::/var/mail/vhosts/pilot180.local/david::" >> mailserver/config/dovecot/users
   docker restart pilot180-dovecot
   ```

3. **Create mailbox directory**:
   ```bash
   docker exec pilot180-postfix mkdir -p /var/mail/vhosts/pilot180.local/david
   docker exec pilot180-postfix chown -R 1000:1000 /var/mail/vhosts/pilot180.local/david
   ```

## Troubleshooting

### Problem: Email Not Delivered

**Check 1: Verify Postfix Configuration**
```bash
docker exec pilot180-postfix postconf mydestination virtual_mailbox_domains
```

Should show:
```
mydestination = localhost.pilot180.local, localhost, mail.pilot180.local
virtual_mailbox_domains = pilot180.local
```

**Check 2: View Postfix Logs**
```bash
docker logs pilot180-postfix 2>&1 | grep -E "status=|error"
```

Look for:
- `status=sent (delivered to maildir)` ✅ Success
- `status=deferred` ⚠️ Temporary failure
- `Permission denied` ❌ Fix permissions

**Check 3: Inspect Mail Queue**
```bash
docker exec pilot180-postfix mailq
```

If messages are stuck, check the error messages.

**Check 4: Test Virtual Mailbox Lookup**
```bash
docker exec pilot180-postfix postmap -q "bob@pilot180.local" lmdb:/etc/postfix/vmailbox
```

Should return: `pilot180.local/bob/`

### Problem: Dovecot Not Starting

**Check Configuration Syntax**:
```bash
docker exec pilot180-dovecot doveconf -n
```

**View Error Logs**:
```bash
docker logs pilot180-dovecot 2>&1 | grep -i error
```

### Problem: 403 Forbidden from Backend

This means Keycloak JWT validation failed.

**Solution**: Ensure environment variables are correct:
```bash
docker exec pilot180-backend env | grep KEYCLOAK
```

Should show:
```
KEYCLOAK_URL=http://keycloak:8080/
KEYCLOAK_ISSUER=http://localhost:8080/
KEYCLOAK_REALM=pilot180
```

### Problem: Permission Denied Errors

Fix maildir permissions:
```bash
docker exec pilot180-postfix sh -c "
  chown -R 1000:1000 /var/mail/vhosts &&
  chmod -R 755 /var/mail/vhosts
"
```

## Monitoring

### Watch Live Logs

```bash
# Postfix (mail delivery)
docker logs -f pilot180-postfix | grep -E "virtual|status="

# Backend (API calls)
docker logs -f pilot180-backend

# Dovecot (IMAP access)
docker logs -f pilot180-dovecot
```

### Check Service Health

```bash
docker ps | grep -E "postfix|dovecot|backend"
```

### Monitor Mail Queue Size

```bash
watch -n 5 'docker exec pilot180-postfix mailq | tail -1'
```

## Production Recommendations

⚠️ **Current setup is for DEVELOPMENT only**

For production deployment:

1. **Enable SSL/TLS**:
   - Get valid SSL certificates
   - Update Postfix: `smtpd_tls_security_level = encrypt`
   - Update Dovecot: `ssl = required`

2. **Use Strong Passwords**:
   - Hash passwords in Dovecot users file
   - Use `doveadm pw -s SHA512-CRYPT`

3. **Enable SASL Authentication**:
   - Set `smtpd_sasl_auth_enable = yes` in Postfix

4. **Configure DNS Properly**:
   - MX records
   - SPF records
   - DKIM signing
   - DMARC policy

5. **Set Up Firewall Rules**:
   - Only expose necessary ports
   - Use fail2ban for brute force protection

6. **Regular Backups**:
   - Backup `/var/mail/vhosts` directory
   - Backup configuration files

## Quick Reference Commands

### Restart Services
```bash
docker restart pilot180-postfix pilot180-dovecot pilot180-backend
```

### Clear Mail Queue
```bash
docker exec pilot180-postfix postsuper -d ALL
```

### Reload Configuration
```bash
docker exec pilot180-postfix postfix reload
docker restart pilot180-dovecot
```

### View Raw Email
```bash
docker exec pilot180-dovecot cat /var/mail/vhosts/pilot180.local/bob/new/*
```

### Test SMTP Connection
```bash
telnet localhost 25
EHLO pilot180.local
MAIL FROM:<alice@pilot180.local>
RCPT TO:<bob@pilot180.local>
DATA
Subject: Test
Test message
.
QUIT
```

## Support

If you encounter issues:

1. Check logs: `docker logs <container-name>`
2. Verify configuration: `postconf -n` / `doveconf -n`
3. Check permissions: `ls -la /var/mail/vhosts/`
4. Test connectivity: `telnet localhost 25` / `telnet localhost 143`

## Additional Resources

- [Postfix Documentation](http://www.postfix.org/documentation.html)
- [Dovecot Wiki](https://doc.dovecot.org/)
- [Backend API Docs](../backend/README.md)
