#!/bin/sh

echo "🚀 Starting Pilot180 Mail Backend..."
echo "=================================="

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until nc -z $PGHOST $PGPORT; do
  echo "Waiting for PostgreSQL at $PGHOST:$PGPORT..."
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Run database migrations
echo "📦 Running database migrations..."
node scripts/migrate.js
echo "✅ Migrations complete!"

# Start the application
echo "🚀 Starting application..."
exec node index.js
