#!/bin/bash

echo "Initializing Postfix Mail Server..."

echo "Creating virtual mailbox database..."
postmap /etc/postfix/vmailbox

echo "Creating mail directories..."
mkdir -p /var/mail/vhosts/pilot180.local/alice
mkdir -p /var/mail/vhosts/pilot180.local/bob
mkdir -p /var/mail/vhosts/pilot180.local/charlie
chown -R 1000:1000 /var/mail/vhosts
chmod -R 755 /var/mail/vhosts

echo "Postfix initialization complete!"
