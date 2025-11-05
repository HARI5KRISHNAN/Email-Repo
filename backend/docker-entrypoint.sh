#!/bin/sh

echo "Starting Pilot180 Mail Backend..."

echo "Waiting for PostgreSQL..."
until nc -z $PGHOST $PGPORT; do
  echo "Waiting for PostgreSQL at $PGHOST:$PGPORT..."
  sleep 2
done
echo "PostgreSQL is ready!"

echo "Running database migrations..."
node scripts/migrate.js
echo "Migrations complete!"

echo "Starting application..."
exec node index.js
