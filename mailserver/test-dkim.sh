#!/bin/bash
# DKIM Email Test Script
# This script sends a test email through Postfix with DKIM signing

echo "=========================================="
echo "DKIM Configuration Test"
echo "=========================================="
echo ""

# Check if services are running
echo "1. Checking service status..."
docker compose ps | grep -E "(postfix|opendkim)"
echo ""

# Check Postfix milter configuration
echo "2. Verifying Postfix milter configuration..."
docker exec pilot180-postfix postconf | grep -E "^(smtpd_milters|non_smtpd_milters|milter_default_action)"
echo ""

# Check OpenDKIM connection
echo "3. Testing Postfix -> OpenDKIM connectivity..."
docker exec pilot180-postfix nc -zv opendkim 8891
echo ""

# Send test email via SMTP
echo "4. Sending test email with DKIM signature..."
docker exec pilot180-postfix sh -c 'echo -e "Subject: DKIM Test Email\nFrom: test@pilot180.local\nTo: test@pilot180.local\n\nThis is a test email with DKIM signature.\n\nIf you see DKIM-Signature in the headers, it worked!" | sendmail -v test@pilot180.local'
echo ""

echo "5. Checking Postfix logs for DKIM activity..."
sleep 2
docker logs pilot180-postfix --tail 20 | grep -i "milter\|dkim" || echo "No DKIM/milter activity in recent logs"
echo ""

echo "6. Checking OpenDKIM logs..."
docker logs pilot180-opendkim --tail 10
echo ""

echo "=========================================="
echo "Test complete!"
echo ""
echo "To verify DKIM signature manually:"
echo "1. Go to http://localhost:3006"
echo "2. Log in and send an email"
echo "3. Check the email headers for 'DKIM-Signature'"
echo "=========================================="
