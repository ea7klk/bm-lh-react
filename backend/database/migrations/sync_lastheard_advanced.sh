#!/bin/bash

# Advanced incremental synchronization script for lastheard data
# This script handles potential duplicates and provides better conflict resolution

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

echo "Starting advanced historical backfill lastheard synchronization at $(date)" | tee "$LOG_FILE"

# Function to execute SQL in destination database
exec_dest_sql() {
    docker exec -i "$DEST_CONTAINER" psql \
        -h localhost \
        -p 5432 \
        -U "$DEST_USER" \
        -d "$DEST_DB" \
        -t -c "$1" | tr -d ' '
}

# Function to execute SQL in source database
exec_source_sql() {
    docker exec -i "$SOURCE_CONTAINER" psql \
        -h localhost \
        -p 5432 \
        -U "$SOURCE_USER" \
        -d "$SOURCE_DB" \
        -t -c "$1" | tr -d ' '
}

# Step 1: Get synchronization reference points
echo "Analyzing databases for synchronization..." | tee -a "$LOG_FILE"

# Get oldest timestamp from destination
DEST_OLDEST_TIMESTAMP=$(exec_dest_sql "SELECT COALESCE(MIN(\"Start\"), 9999999999999) FROM lastheard;")
DEST_COUNT=$(exec_dest_sql "SELECT COUNT(*) FROM lastheard;")

# Get source database info
SOURCE_COUNT=$(exec_source_sql "SELECT COUNT(*) FROM lastheard;")
SOURCE_OLDEST_TIMESTAMP=$(exec_source_sql "SELECT COALESCE(MIN(\"Start\"), 0) FROM lastheard;")

echo "Source database: $SOURCE_COUNT records, oldest timestamp: $SOURCE_OLDEST_TIMESTAMP" | tee -a "$LOG_FILE"
echo "Destination database: $DEST_COUNT records, oldest timestamp: $DEST_OLDEST_TIMESTAMP" | tee -a "$LOG_FILE"

# Step 2: Check for historical data that's missing
OVERLAP_CHECK_TIMESTAMP=$((DEST_OLDEST_TIMESTAMP + 3600))  # Check 1 hour overlap for safety

echo "Checking for historical data gaps..." | tee -a "$LOG_FILE"

# Create a more sophisticated export that excludes existing records
cat > "$TEMP_DIR/export_query.sql" << EOF
-- Export only historical records that don't already exist in destination
-- We use a combination of SourceID, DestinationID, and Start timestamp for uniqueness
COPY (
    SELECT 
        "SourceID",
        "DestinationID", 
        "SourceCall",
        "SourceName",
        "DestinationCall",
        "DestinationName",
        "Start",
        "Stop",
        "TalkerAlias",
        duration,
        created_at
    FROM lastheard 
    WHERE "Start" < $OVERLAP_CHECK_TIMESTAMP
    ORDER BY "Start"
) TO STDOUT WITH (FORMAT CSV, HEADER);
EOF

# Step 3: Export potentially missing historical records from source
echo "Exporting historical records from source database (checking before timestamp $OVERLAP_CHECK_TIMESTAMP)..." | tee -a "$LOG_FILE"

docker exec -i "$SOURCE_CONTAINER" psql \
    -h localhost \
    -p 5432 \
    -U "$SOURCE_USER" \
    -d "$SOURCE_DB" \
    -f - < "$TEMP_DIR/export_query.sql" > "$TEMP_DIR/source_records.csv"

# Count exported records
EXPORTED_COUNT=$(tail -n +2 "$TEMP_DIR/source_records.csv" | wc -l | tr -d ' ')
echo "Exported $EXPORTED_COUNT historical records from source for analysis" | tee -a "$LOG_FILE"

if [ "$EXPORTED_COUNT" -eq 0 ]; then
    echo "No historical records to backfill. All historical data appears to be present." | tee -a "$LOG_FILE"
    exit 0
fi

# Step 4: Create a more sophisticated import script
cat > "$TEMP_DIR/smart_import.sql" << 'EOF'
-- Create temporary table for new records
CREATE TEMP TABLE temp_import (
    "SourceID" integer,
    "DestinationID" integer,
    "SourceCall" text,
    "SourceName" text,
    "DestinationCall" text,
    "DestinationName" text,
    "Start" bigint,
    "Stop" bigint,
    "TalkerAlias" text,
    duration integer,
    created_at bigint
);

-- We'll load the CSV data here (this will be done via COPY command)
\copy temp_import FROM '/tmp/source_records.csv' WITH (FORMAT CSV, HEADER);

-- Insert only records that don't already exist
-- We consider a record duplicate if SourceID, DestinationID, and Start match
INSERT INTO lastheard (
    "SourceID", "DestinationID", "SourceCall", "SourceName", 
    "DestinationCall", "DestinationName", "Start", "Stop", 
    "TalkerAlias", duration, created_at
)
SELECT 
    t."SourceID", t."DestinationID", t."SourceCall", t."SourceName",
    t."DestinationCall", t."DestinationName", t."Start", t."Stop",
    t."TalkerAlias", t.duration, t.created_at
FROM temp_import t
WHERE NOT EXISTS (
    SELECT 1 FROM lastheard l 
    WHERE l."SourceID" = t."SourceID" 
    AND l."DestinationID" = t."DestinationID" 
    AND l."Start" = t."Start"
);

-- Report on what was inserted
SELECT COUNT(*) as "Records Inserted" FROM lastheard l
WHERE EXISTS (
    SELECT 1 FROM temp_import t 
    WHERE l."SourceID" = t."SourceID" 
    AND l."DestinationID" = t."DestinationID" 
    AND l."Start" = t."Start"
);
EOF

# Step 5: Copy CSV file into destination container and import
echo "Copying data to destination container..." | tee -a "$LOG_FILE"

docker cp "$TEMP_DIR/source_records.csv" "$DEST_CONTAINER:/tmp/source_records.csv"

# Step 6: Execute the smart import
echo "Executing smart import (avoiding duplicates)..." | tee -a "$LOG_FILE"

docker exec -i "$DEST_CONTAINER" psql \
    -h localhost \
    -p 5432 \
    -U "$DEST_USER" \
    -d "$DEST_DB" \
    -f - < "$TEMP_DIR/smart_import.sql" 2>&1 | tee -a "$LOG_FILE"

# Step 7: Final verification
echo "Final verification..." | tee -a "$LOG_FILE"

FINAL_DEST_COUNT=$(exec_dest_sql "SELECT COUNT(*) FROM lastheard;")
RECORDS_ADDED=$((FINAL_DEST_COUNT - DEST_COUNT))

echo "Records added: $RECORDS_ADDED" | tee -a "$LOG_FILE"
echo "Final destination count: $FINAL_DEST_COUNT" | tee -a "$LOG_FILE"
echo "Advanced historical backfill synchronization completed at $(date)" | tee -a "$LOG_FILE"

# Cleanup
docker exec "$DEST_CONTAINER" rm -f /tmp/source_records.csv

echo "Sync log saved to: $LOG_FILE"