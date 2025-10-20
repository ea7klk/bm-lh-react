#!/bin/bash

# Migration script to add summary tables
# Run this script to add the hourly summary tables to your database

set -e  # Exit on any error

# Configuration
CONTAINER_NAME="bm-lh-postgres"
DB_NAME="bm_lastheard"
DB_USER="bmuser"
MIGRATION_FILE="/tmp/add_summary_tables.sql"

echo "Starting summary tables migration at $(date)"

# Check if container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "ERROR: Container $CONTAINER_NAME is not running"
    exit 1
fi

# Copy migration file to container
echo "Copying migration file to container..."
docker cp "$(dirname "$0")/add_summary_tables.sql" "$CONTAINER_NAME:$MIGRATION_FILE"

# Run migration
echo "Running migration..."
docker exec -i "$CONTAINER_NAME" psql \
  -h localhost \
  -p 5432 \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f "$MIGRATION_FILE"

# Verify tables were created
echo "Verifying tables were created..."
TABLES_CREATED=$(docker exec -i "$CONTAINER_NAME" psql \
  -h localhost \
  -p 5432 \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('lastheard_hourly_summary', 'summary_processing_log');" | tr -d ' ')

if [ "$TABLES_CREATED" -eq 2 ]; then
    echo "✅ Migration completed successfully!"
    echo "Created tables:"
    echo "  - lastheard_hourly_summary"
    echo "  - summary_processing_log"
else
    echo "❌ Migration may have failed. Expected 2 tables, found $TABLES_CREATED"
    exit 1
fi

# Clean up
docker exec -i "$CONTAINER_NAME" rm -f "$MIGRATION_FILE"

echo "Migration completed at $(date)"
echo ""
echo "Next steps:"
echo "1. Update your backend server to include the new summary routes"
echo "2. The hourly summary job will start automatically when the scheduler is running"
echo "3. You can trigger manual processing via POST /api/summary/process"
echo "4. Monitor processing status via GET /api/summary/status"