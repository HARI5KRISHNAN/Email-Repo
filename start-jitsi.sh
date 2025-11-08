#!/bin/bash

# Jitsi Server Quick Start Script
# This script starts the Jitsi Meet server for video conferencing

echo "🎥 Starting Jitsi Meet Server..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first:"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
fi

# Start Jitsi services
echo "🚀 Starting Jitsi containers..."
echo ""

if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    docker compose -f docker-compose.jitsi.yml up -d
else
    docker-compose -f docker-compose.jitsi.yml up -d
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Jitsi server started successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Wait 10-20 seconds for all services to become healthy"
    echo "   2. Check status: docker compose -f docker-compose.jitsi.yml ps"
    echo "   3. View logs: docker compose -f docker-compose.jitsi.yml logs -f"
    echo "   4. Access Jitsi at: http://localhost:8000"
    echo ""
    echo "🔧 To stop Jitsi:"
    echo "   docker compose -f docker-compose.jitsi.yml down"
    echo ""
else
    echo ""
    echo "❌ Failed to start Jitsi server"
    echo "   Check the error messages above"
    exit 1
fi
