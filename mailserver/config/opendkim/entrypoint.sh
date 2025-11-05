#!/bin/sh
# OpenDKIM entrypoint script to fix permissions on Windows volumes

# Fix permissions for OpenDKIM
chown -R opendkim:opendkim /etc/opendkim/keys
chmod 700 /etc/opendkim/keys
find /etc/opendkim/keys -type d -exec chmod 700 {} \;
find /etc/opendkim/keys -name "*.private" -exec chmod 600 {} \;
find /etc/opendkim/keys -name "*.public" -exec chmod 644 {} \;

# Start OpenDKIM
exec /init opendkim -f
