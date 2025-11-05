#!/bin/bash
# Dovecot Inbox Debug Script

echo "==================================="
echo "1. Checking Dovecot Logs"
echo "==================================="
docker logs pilot180-dovecot --tail 30 2>&1

echo ""
echo "==================================="
echo "2. Checking Mail Directory Structure"
echo "==================================="
docker exec pilot180-dovecot sh -c "ls -la /var/mail/vhosts/pilot180.local/"

echo ""
echo "==================================="
echo "3. Checking Bob's Mailbox"
echo "==================================="
docker exec pilot180-dovecot sh -c "ls -laR /var/mail/vhosts/pilot180.local/bob/" 2>&1

echo ""
echo "==================================="
echo "4. Testing IMAP Authentication for Bob"
echo "==================================="
docker exec pilot180-dovecot doveadm auth test bob@pilot180.local password 2>&1

echo ""
echo "==================================="
echo "5. Testing IMAP Authentication for Alice"
echo "==================================="
docker exec pilot180-dovecot doveadm auth test alice@pilot180.local password 2>&1

echo ""
echo "==================================="
echo "6. Backend IMAP Configuration"
echo "==================================="
docker exec pilot180-backend printenv | grep -E 'IMAP|MAIL_DOMAIN'

echo ""
echo "==================================="
echo "7. Testing IMAP Connection from Backend"
echo "==================================="
docker exec pilot180-backend sh -c "nc -zv host.docker.internal 143 2>&1 || echo 'nc not available, trying telnet...' && timeout 2 telnet host.docker.internal 143 2>&1 | head -3"

echo ""
echo "==================================="
echo "8. Checking Dovecot Mail Location Config"
echo "==================================="
docker exec pilot180-dovecot cat /etc/dovecot/conf.d/10-mail.conf | grep mail_location

echo ""
echo "==================================="
echo "9. Checking for existing emails in maildir"
echo "==================================="
docker exec pilot180-dovecot sh -c "find /var/mail/vhosts/pilot180.local/ -type f -name '*' 2>/dev/null | head -5"

echo ""
echo "==================================="
echo "✅ Diagnostics Complete"
echo "==================================="
