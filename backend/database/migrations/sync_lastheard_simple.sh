#!/bin/bash

# Simple and reliable incremental sync using database native features
# This approach uses INSERT ... ON CONFLICT to handle duplicates gracefully

set -e

# Configuration
SOURCE_CONTAINER="bminfo-pgsql-postgres-1"
SOURCE_DB="bm_lastheard"
SOURCE_USER="bm_lastheard"

DEST_CONTAINER="bm-lh-postgres"
DEST_DB="bm_lastheard"
DEST_USER="bmuser"

TEMP_DIR="/tmp/lastheard_sync"
LOG_FILE="$TEMP_DIR/sync_$(date +%Y%m%d_%H%M%S).log"

mkdir -p "$TEMP_DIR"

echo "Starting historical backfill sync at $(date)" | tee "$LOG_FILE"

# Function to get record count from destination
get_dest_count() {
    docker exec -i "$DEST_CONTAINER" psql \
        -h localhost -p 5432 -U "$DEST_USER" -d "$DEST_DB" \
        -t -c "SELECT COUNT(*) FROM lastheard;" | tr -d ' '
}

# Get initial count
INITIAL_COUNT=$(get_dest_count)
echo "Initial destination records: $INITIAL_COUNT" | tee -a "$LOG_FILE"

# Get the oldest timestamp from destination for reference
OLDEST_DEST_TIMESTAMP=$(docker exec -i "$DEST_CONTAINER" psql \
    -h localhost -p 5432 -U "$DEST_USER" -d "$DEST_DB" \
    -t -c "SELECT COALESCE(MIN(\"Start\"), 9999999999999) FROM lastheard;" | tr -d ' ')

echo "Oldest timestamp in destination: $OLDEST_DEST_TIMESTAMP" | tee -a "$LOG_FILE"

# Calculate a safe ending point (e.g., 1 hour after oldest to handle any gaps)
SYNC_TO_TIMESTAMP=$((OLDEST_DEST_TIMESTAMP + 3600))

echo "Syncing historical records up to timestamp: $SYNC_TO_TIMESTAMP" | tee -a "$LOG_FILE"

# Step 1: Create a unique constraint on destination if it doesn't exist
echo "Ensuring unique constraint exists..." | tee -a "$LOG_FILE"

docker exec -i "$DEST_CONTAINER" psql \
    -h localhost -p 5432 -U "$DEST_USER" -d "$DEST_DB" \
    -c "
    DO \$\$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'lastheard_unique_transmission'
        ) THEN
            ALTER TABLE lastheard 
            ADD CONSTRAINT lastheard_unique_transmission 
            UNIQUE (\"SourceID\", \"DestinationID\", \"Start\");
        END IF;
    END
    \$\$;
    " 2>&1 | tee -a "$LOG_FILE"

# Step 2: Export historical records from source with INSERT ... ON CONFLICT
echo "Exporting and importing historical records with conflict resolution..." | tee -a "$LOG_FILE"

# Create the WHERE condition properly
WHERE_CONDITION="\"Start\" < ${SYNC_TO_TIMESTAMP}"

# Create the export with ON CONFLICT handling for historical data
docker exec -i "$SOURCE_CONTAINER" pg_dump \
    -h localhost -p 5432 -U "$SOURCE_USER" -d "$SOURCE_DB" \
    --table=lastheard \
    --data-only \
    --column-inserts \
    --where "$WHERE_CONDITION" | \
sed 's/INSERT INTO public\.lastheard/INSERT INTO public.lastheard/g' | \
sed 's/INSERT INTO public\.lastheard (/INSERT INTO public.lastheard (/g; s/);$/) ON CONFLICT ("SourceID", "DestinationID", "Start") DO NOTHING;/g' | \
docker exec -i "$DEST_CONTAINER" psql \
    -h localhost -p 5432 -U "$DEST_USER" -d "$DEST_DB" \
    2>&1 | tee -a "$LOG_FILE"

# Step 3: Report results
FINAL_COUNT=$(get_dest_count)
RECORDS_ADDED=$((FINAL_COUNT - INITIAL_COUNT))

echo "Historical backfill completed!" | tee -a "$LOG_FILE"
echo "Records added: $RECORDS_ADDED" | tee -a "$LOG_FILE"
echo "Final record count: $FINAL_COUNT" | tee -a "$LOG_FILE"
echo "Historical sync finished at $(date)" | tee -a "$LOG_FILE"

echo "Log saved to: $LOG_FILE"