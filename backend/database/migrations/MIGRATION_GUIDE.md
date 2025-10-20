# Database Migration Guide

This guide helps you migrate user data from an old BM Last Heard database to the new authentication system.

## Migration Methods

### Method 1: Docker-to-Docker (Recommended)

If both your old and new databases are running in Docker containers:

```bash
# 1. Copy the migration script to your new container
docker cp backend/database/migrations/migrate_users.js your_new_container:/tmp/

# 2. Install dependencies in the container (if needed)
docker exec your_new_container npm install pg

# 3. Run the migration
docker exec -e OLD_DB_HOST=your_old_container \
           -e OLD_DB_NAME=your_old_db \
           -e OLD_DB_USER=postgres \
           -e OLD_DB_PASSWORD=your_password \
           -e VERBOSE=true \
           your_new_container node /tmp/migrate_users.js
```

### Method 2: Host-based Migration

If you want to run the migration from your host machine:

```bash
# 1. Install Node.js dependencies
cd backend/database/migrations
npm install pg

# 2. Set environment variables and run
export OLD_DB_HOST=localhost
export OLD_DB_PORT=5432  # or your old DB port
export OLD_DB_NAME=your_old_database
export OLD_DB_USER=postgres
export OLD_DB_PASSWORD=your_password

export NEW_DB_HOST=localhost  
export NEW_DB_PORT=5432  # or your new DB port
export NEW_DB_NAME=bm_lastheard
export NEW_DB_USER=postgres
export NEW_DB_PASSWORD=your_new_password

# 3. Run migration
node migrate_users.js
```

### Method 3: Using pg_dump (Traditional)

```bash
# 1. Make the shell script executable
chmod +x backend/database/migrations/migrate_users.sh

# 2. Run with Docker containers
./backend/database/migrations/migrate_users.sh \
  --mode=docker \
  --old-container=your_old_container \
  --new-container=your_new_container \
  --old-db=your_old_database \
  --old-user=postgres

# 3. Or run with direct database connections
./backend/database/migrations/migrate_users.sh \
  --mode=direct \
  --old-host=old-server.com \
  --old-db=legacy_bm_db \
  --old-user=admin \
  --old-password=secret
```

### Method 4: Manual CLI Commands (Step-by-step)

If you prefer complete control with individual commands:

#### Step 1: Export Users from Source Database

```bash
# Option A: Export as SQL with INSERT statements
docker exec -i <source_container_name> pg_dump \
  -h localhost \
  -p 5432 \
  -U <source_username> \
  -d <source_database> \
  --table=users \
  --data-only \
  --column-inserts \
  > users_export.sql

# Option B: Export as CSV for easier processing
docker exec -i <source_container_name> psql \
  -h localhost \
  -p 5432 \
  -U <source_username> \
  -d <source_database> \
  -c "COPY (SELECT id, callsign, username, email, password_hash, created_at FROM users) TO STDOUT WITH CSV HEADER;" \
  > users_export.csv
```

#### Step 2: Prepare Target Database

```bash
# Ensure target database schema is up to date
docker exec -i <target_container_name> psql \
  -h localhost \
  -p 5432 \
  -U <target_username> \
  -d <target_database> \
  -f /app/database/schema.sql

# Verify tables exist
docker exec -i <target_container_name> psql \
  -h localhost \
  -p 5432 \
  -U <target_username> \
  -d <target_database> \
  -c "\dt"
```

#### Step 3: Transform and Import Data

**Option A: Direct SQL Import (if schemas match)**
```bash
# Copy export file to target container
docker cp users_export.sql <target_container_name>:/tmp/

# Import directly
docker exec -i <target_container_name> psql \
  -h localhost \
  -p 5432 \
  -U <target_username> \
  -d <target_database> \
  -f /tmp/users_export.sql
```

**Option B: CSV Import with Column Mapping**
```bash
# Copy CSV to target container
docker cp users_export.csv <target_container_name>:/tmp/

# Import with specific column mapping
docker exec -i <target_container_name> psql \
  -h localhost \
  -p 5432 \
  -U <target_username> \
  -d <target_database> \
  -c "
-- Create temporary table for import
CREATE TEMP TABLE users_temp (
  old_id INTEGER,
  old_callsign VARCHAR(50),
  old_username VARCHAR(255),
  old_email VARCHAR(255),
  old_password VARCHAR(255),
  old_created_at TIMESTAMP
);

-- Import CSV data
\COPY users_temp FROM '/tmp/users_export.csv' WITH CSV HEADER;

-- Transform and insert into new schema
INSERT INTO users (callsign, name, email, password_hash, created_at, updated_at, email_verified, is_active)
SELECT 
  old_callsign,
  COALESCE(old_username, old_callsign),  -- Use callsign as name if username is null
  old_email,
  old_password,
  old_created_at,
  old_created_at,  -- Use created_at as updated_at
  true,            -- Default email_verified to true
  true             -- Default is_active to true
FROM users_temp
WHERE old_callsign IS NOT NULL 
  AND old_email IS NOT NULL
ON CONFLICT (callsign) DO NOTHING;  -- Skip duplicates

-- Update sequence counter
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
"
```

#### Step 4: Verify Migration Results

```bash
# Check record counts
echo "=== Record Count Comparison ==="
echo "Source database:"
docker exec -i <source_container_name> psql \
  -h localhost \
  -p 5432 \
  -U <source_username> \
  -d <source_database> \
  -t -c "SELECT COUNT(*) FROM users;"

echo "Target database:"
docker exec -i <target_container_name> psql \
  -h localhost \
  -p 5432 \
  -U <target_username> \
  -d <target_database> \
  -t -c "SELECT COUNT(*) FROM users;"

# Check sample data
echo "=== Sample Migrated Data ==="
docker exec -i <target_container_name> psql \
  -h localhost \
  -p 5432 \
  -U <target_username> \
  -d <target_database> \
  -c "SELECT id, callsign, name, email, created_at FROM users ORDER BY created_at LIMIT 5;"

# Verify constraints and indexes
echo "=== Schema Verification ==="
docker exec -i <target_container_name> psql \
  -h localhost \
  -p 5432 \
  -U <target_username> \
  -d <target_database> \
  -c "
\d+ users;
SELECT conname, contype FROM pg_constraint WHERE conrelid = 'users'::regclass;
"
```

#### Manual Migration Checklist

- [ ] Export source user data (SQL or CSV)
- [ ] Copy export file to target container
- [ ] Verify target database schema is current
- [ ] Create temporary import table if using CSV
- [ ] Transform and import user data
- [ ] Handle duplicate callsigns/emails appropriately
- [ ] Update sequence counters
- [ ] Verify record counts match expectations
- [ ] Test sample user data integrity
- [ ] Clean up temporary files

## Pre-Migration Checklist

1. **Backup your databases** before starting migration
2. **Verify database connections** to both old and new databases
3. **Check old database schema** - the script auto-detects common column names
4. **Run in dry-run mode first** to see what would be migrated

## Common Database Schema Mappings

The migration script automatically detects these common column patterns:

| New Schema Column | Old Schema Possibilities |
|-------------------|-------------------------|
| `callsign` | callsign, call_sign, call, amateur_callsign |
| `name` | name, full_name, username, display_name |
| `email` | email, email_address, mail, e_mail |
| `password_hash` | password, password_hash, passwd, pass |
| `created_at` | created_at, created, creation_date, register_date |

## Example Commands

### Dry Run First (Recommended)
```bash
# Test what would be migrated without making changes
DRY_RUN=true VERBOSE=true \
OLD_DB_NAME=old_bm_database OLD_DB_USER=postgres \
node migrate_users.js
```

### Full Migration
```bash
# Actual migration with verbose output
VERBOSE=true \
OLD_DB_NAME=old_bm_database OLD_DB_USER=postgres OLD_DB_PASSWORD=secret \
NEW_DB_PASSWORD=newsecret \
node migrate_users.js
```

### Docker Network Migration
```bash
# When containers are in the same Docker network
docker exec -e OLD_DB_HOST=old_bm_container \
           -e OLD_DB_NAME=bm_lastheard \
           -e OLD_DB_USER=postgres \
           -e NEW_DB_PASSWORD=newsecret \
           new_bm_container node /tmp/migrate_users.js
```

## Troubleshooting

### Connection Issues

**Error: Connection refused**
- Check if databases are running: `docker ps`
- Verify container names and ports
- Check if containers are in the same network

**Error: Authentication failed**
- Verify database usernames and passwords
- Check if the user has necessary permissions

### Schema Detection Issues

**Error: No user tables found**
- Your old database might use different table names
- Use `VERBOSE=true` to see what tables were found
- You may need to customize the migration query

**Error: Could not auto-detect column mappings**
- Your old schema uses non-standard column names
- Edit the `migrate_users.js` file to add custom mappings
- Look for the `commonMappings` object in the script

### Data Issues

**Warning: Some users skipped**
- Users with duplicate callsigns are skipped (ON CONFLICT DO NOTHING)
- Users with invalid data (no callsign, invalid email) are skipped
- Check the logs for specific reasons

## Customization

If the automatic detection doesn't work for your schema, you can customize the migration:

1. **Edit column mappings** in `migrate_users.js`:
```javascript
const commonMappings = {
  callsign: ['your_callsign_column'],
  name: ['your_name_column'],
  email: ['your_email_column'],
  // ... add your custom mappings
};
```

2. **Modify the SQL query** generation in the `generateMigrationQuery` function

3. **Add custom validation** or data transformation logic

## Post-Migration Steps

1. **Verify user count** matches expected numbers
2. **Test authentication** with a few migrated accounts
3. **Check password hashes** - you may need to force password resets
4. **Send notifications** to migrated users about the new system
5. **Clean up backup files** after successful verification

## Security Considerations

- **Password Hashes**: Old password hashes are migrated as-is, but consider forcing password resets for better security
- **Email Verification**: Migrated users might need to re-verify their email addresses
- **Session Cleanup**: Existing sessions from the old system won't work
- **Backup Security**: Store migration backups securely and delete when no longer needed

## Recovery

If migration fails or produces unexpected results:

1. **Restore from backup** if you made database backups
2. **Check backup files** created by the migration script
3. **Re-run with different parameters** or after fixing issues
4. **Manual cleanup** using SQL if only partial migration occurred:

```sql
-- Remove migrated users if needed to re-run migration
DELETE FROM users WHERE created_at >= [migration_timestamp];
```