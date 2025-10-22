#!/bin/bash

# Update email_change_tokens table structure
# This script updates the email change table to match the backend service implementation

set -e

echo "Starting email change tokens table update..."

# Database connection details from environment or defaults
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-brandmeister_lh}"
DB_USER="${DB_USER:-postgres}"

# Check if running in Docker
if [ -f /.dockerenv ]; then
    echo "Running inside Docker container"
    export PGHOST=$DB_HOST
    export PGPORT=$DB_PORT
    export PGDATABASE=$DB_NAME
    export PGUSER=$DB_USER
    
    psql -f /app/backend/database/migrations/update_email_change_tokens.sql
else
    echo "Running on host system"
    echo "Please make sure PostgreSQL is running and accessible"
    echo "Executing migration..."
    
    psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -f $(dirname "$0")/update_email_change_tokens.sql
fi

echo "Email change tokens table update completed successfully!"