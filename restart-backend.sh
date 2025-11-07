#!/bin/bash
set -e

echo "🔄 Restarting backend with new changes..."
echo ""

# Run database migrations
echo "📊 Running database migrations..."
docker exec pilot180-backend npm run migrate
echo ""

# Restart backend container
echo "🔄 Restarting backend container..."
docker-compose restart backend
echo ""

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 3
until curl -s http://localhost:8081/health > /dev/null 2>&1; do
    echo "   Still waiting..."
    sleep 2
done
echo ""

echo "✅ Backend restarted successfully!"
echo "📍 Backend API: http://localhost:8081"
echo "📅 Calendar endpoint: http://localhost:8081/api/mail/calendar/meetings"
echo ""
