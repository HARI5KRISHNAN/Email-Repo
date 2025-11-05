#!/bin/bash
set -e

echo "🚀 Starting Pilot180 Email System"
echo "=================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Stop and remove existing containers
echo "🧹 Cleaning up existing containers..."
docker-compose down -v 2>/dev/null || true
echo ""

# Build and start services
echo "📦 Building and starting all services..."
docker-compose up -d --build
echo ""

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
echo "   This may take 1-2 minutes..."
echo ""

# Wait for PostgreSQL
echo "   Waiting for PostgreSQL..."
until docker exec pilot180-postgres pg_isready -U postgres > /dev/null 2>&1; do
    sleep 2
done
echo "   ✅ PostgreSQL is ready"

# Wait for Keycloak
echo "   Waiting for Keycloak..."
until docker logs pilot180-keycloak 2>&1 | grep -q "started in"; do
    sleep 5
done
echo "   ✅ Keycloak is ready"

# Wait for Backend
echo "   Waiting for Backend..."
until curl -s http://localhost:8081/health > /dev/null 2>&1; do
    sleep 2
done
echo "   ✅ Backend is ready"

# Initialize Postfix
echo ""
echo "📧 Initializing mail system..."
docker exec pilot180-postfix postmap /etc/postfix/vmailbox
docker exec pilot180-postfix postfix reload
echo "   ✅ Postfix configured"

# Create mail directories
echo "   Creating mail directories..."
docker exec pilot180-dovecot mkdir -p /var/mail/vhosts/pilot180.local/alice \
    /var/mail/vhosts/pilot180.local/bob \
    /var/mail/vhosts/pilot180.local/charlie
docker exec pilot180-dovecot chown -R vmail:vmail /var/mail/vhosts
echo "   ✅ Mail directories created"

# Send test emails
echo ""
echo "📨 Sending test emails..."
docker exec pilot180-postfix sh -c 'echo "Subject: Welcome to Pilot180
From: system@pilot180.local

Welcome Bob! Your mailbox is ready." | sendmail bob@pilot180.local'

docker exec pilot180-postfix sh -c 'echo "Subject: Welcome to Pilot180
From: system@pilot180.local

Welcome Alice! Your mailbox is ready." | sendmail alice@pilot180.local'

echo "   ✅ Test emails sent"

# Summary
echo ""
echo "=================================="
echo "🎉 Pilot180 Email System is Ready!"
echo "=================================="
echo ""
echo "📍 Access Points:"
echo "   Frontend:      http://localhost:3006 (or 3007, 5173)"
echo "   Backend API:   http://localhost:8081"
echo "   Keycloak:      http://localhost:8080/admin (admin/admin)"
echo "   MailHog:       http://localhost:8025"
echo ""
echo "👤 Test Users (all passwords: 'password'):"
echo "   - alice@pilot180.local"
echo "   - bob@pilot180.local"
echo "   - charlie@pilot180.local"
echo ""
echo "📝 Next Steps:"
echo "   1. Start the frontend: cd frontend && npm install && npm run dev"
echo "   2. Open http://localhost:3006 in your browser"
echo "   3. Login with any test user above"
echo ""
echo "🛠️  Useful Commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop all:      docker-compose down"
echo "   Restart:       ./start.sh"
echo ""
