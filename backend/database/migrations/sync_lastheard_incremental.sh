#!/bin/bash

# Incremental synchronization script for lastheard data
# This script only transfers records that don't already exist in the destination database

set -e  # Exit on any error

# Configuration
SOURCE_CONTAINER="bminfo-pgsql-postgres-1"
SOURCE_DB="bm_lastheard"
SOURCE_USER="bm_lastheard"

DEST_CONTAINER="bm-lh-postgres"
DEST_DB="bm_lastheard"
DEST_USER="bmuser"

TEMP_DIR="/tmp/lastheard_sync"
EXPORT_FILE="$TEMP_DIR/lastheard_incremental.sql"
LOG_FILE="$TEMP_DIR/sync_$(date +%Y%m%d_%H%M%S).log"

# Create temp directory
mkdir -p "$TEMP_DIR"

echo "Starting historical backfill lastheard synchronization at $(date)" | tee "$LOG_FILE"

# Step 1: Get the oldest timestamp from destination database
echo "Getting oldest timestamp from destination database..." | tee -a "$LOG_FILE"

OLDEST_TIMESTAMP=$(docker exec -i "$DEST_CONTAINER" psql \
  -h localhost \
  -p 5432 \
  -U "$DEST_USER" \
  -d "$DEST_DB" \
  -t -c "SELECT COALESCE(MIN(\"Start\"), 9999999999999) FROM lastheard;" | tr -d ' ')

echo "Oldest timestamp in destination: $OLDEST_TIMESTAMP" | tee -a "$LOG_FILE"

# Step 2: Export only older records from source database
echo "Exporting records older than $OLDEST_TIMESTAMP from source database..." | tee -a "$LOG_FILE"

# Create the WHERE condition properly
WHERE_CONDITION="\"Start\" < ${OLDEST_TIMESTAMP}"

docker exec -i "$SOURCE_CONTAINER" pg_dump \
  -h localhost \
  -p 5432 \
  -U "$SOURCE_USER" \
  -d "$SOURCE_DB" \
  --table=lastheard \
  --data-only \
  --column-inserts \
  --where "$WHERE_CONDITION" \
  > "$EXPORT_FILE"

# Check if any older records were found
RECORD_COUNT=$(grep -c "INSERT INTO" "$EXPORT_FILE" 2>/dev/null || echo "0")
echo "Found $RECORD_COUNT older records to sync" | tee -a "$LOG_FILE"

if [ "$RECORD_COUNT" -eq 0 ]; then
    echo "No older records to sync. All historical data appears to be present." | tee -a "$LOG_FILE"
    exit 0
fi

# Step 3: Import older records to destination database
echo "Importing $RECORD_COUNT older records to destination database..." | tee -a "$LOG_FILE"

docker exec -i "$DEST_CONTAINER" psql \
  -q \
  -h localhost \
  -p 5432 \
  -U "$DEST_USER" \
  -d "$DEST_DB" \
  < "$EXPORT_FILE" 2>&1 | tee -a "$LOG_FILE"

# Step 4: Verify the import
echo "Verifying import..." | tee -a "$LOG_FILE"

DEST_COUNT=$(docker exec -i "$DEST_CONTAINER" psql \
  -h localhost \
  -p 5432 \
  -U "$DEST_USER" \
  -d "$DEST_DB" \
  -t -c "SELECT COUNT(*) FROM lastheard;" | tr -d ' ')

echo "Total records in destination database: $DEST_COUNT" | tee -a "$LOG_FILE"
echo "Historical backfill synchronization completed successfully at $(date)" | tee -a "$LOG_FILE"

# Optional: Clean up temp files (comment out if you want to keep them for debugging)
# rm -f "$EXPORT_FILE"

echo "Sync log saved to: $LOG_FILE"