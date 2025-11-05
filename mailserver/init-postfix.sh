#!/bin/bash
set -e

echo "📧 Initializing Postfix Mail Server..."
echo "====================================="

# Wait a moment for Postfix to start
sleep 2

# Create virtual mailbox database
echo "📦 Creating virtual mailbox database..."
postmap /etc/postfix/vmailbox
echo "✅ Virtual mailbox database created!"

# Create mail directories
echo "📁 Creating mail directories..."
mkdir -p /var/mail/vhosts/pilot180.local/alice
mkdir -p /var/mail/vhosts/pilot180.local/bob
mkdir -p /var/mail/vhosts/pilot180.local/charlie
chown -R 1000:1000 /var/mail/vhosts
chmod -R 755 /var/mail/vhosts
echo "✅ Mail directories created!"

# Reload Postfix
echo "🔄 Reloading Postfix configuration..."
postfix reload
echo "✅ Postfix initialized successfully!"

# Send a test email to Bob
echo "📨 Sending test email to bob@pilot180.local..."
sleep 2
echo "Subject: Welcome to Pilot180 Mail
From: system@pilot180.local

Welcome! Your mailbox is ready.
This is an automated test email to verify mail delivery." | sendmail bob@pilot180.local

echo "✅ Postfix initialization complete!"
