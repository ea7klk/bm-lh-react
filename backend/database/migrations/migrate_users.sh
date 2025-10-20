#!/bin/bash

# User Database Migration Script
# This script migrates users from an old database to the new authentication schema
# Supports both pg_dump/restore approach and direct database connection

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
MIGRATION_MODE=""
OLD_DB_HOST=""
OLD_DB_PORT="5432"
OLD_DB_NAME=""
OLD_DB_USER=""
OLD_DB_PASSWORD=""
NEW_DB_HOST="localhost"
NEW_DB_PORT="5432"
NEW_DB_NAME="bm_lastheard"
NEW_DB_USER="postgres"
NEW_DB_PASSWORD=""
BACKUP_FILE=""
DRY_RUN=false
VERBOSE=false

# Docker container names (if using Docker)
OLD_DOCKER_CONTAINER=""
NEW_DOCKER_CONTAINER=""

print_usage() {
    cat << EOF
User Database Migration Script

USAGE:
    $0 [OPTIONS]

MIGRATION MODES:
    --mode=pgdump       Use pg_dump to export/import data
    --mode=direct       Direct database-to-database connection
    --mode=docker       Docker container to container migration

OPTIONS:
    --old-host=HOST         Old database host (default: localhost)
    --old-port=PORT         Old database port (default: 5432)
    --old-db=DATABASE       Old database name (required)
    --old-user=USER         Old database username (required)
    --old-password=PASS     Old database password
    
    --new-host=HOST         New database host (default: localhost)
    --new-port=PORT         New database port (default: 5432)
    --new-db=DATABASE       New database name (default: bm_lastheard)
    --new-user=USER         New database username (default: postgres)
    --new-password=PASS     New database password
    
    --old-container=NAME    Old database Docker container name
    --new-container=NAME    New database Docker container name
    
    --backup-file=FILE      Path to backup file (for pgdump mode)
    --dry-run              Show what would be done without executing
    --verbose              Show detailed output
    --help                 Show this help message

EXAMPLES:

    # Docker container to container migration
    $0 --mode=docker --old-container=old_db --new-container=new_db \\
       --old-db=old_database --old-user=postgres

    # Direct database migration
    $0 --mode=direct --old-host=oldserver.com --old-db=old_bm \\
       --old-user=admin --old-password=secret

    # Using pg_dump approach
    $0 --mode=pgdump --old-host=oldserver.com --old-db=old_bm \\
       --old-user=admin --backup-file=/tmp/users_backup.sql

EOF
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

verbose_log() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[VERBOSE]${NC} $1"
    fi
}

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        --mode=*)
            MIGRATION_MODE="${arg#*=}"
            ;;
        --old-host=*)
            OLD_DB_HOST="${arg#*=}"
            ;;
        --old-port=*)
            OLD_DB_PORT="${arg#*=}"
            ;;
        --old-db=*)
            OLD_DB_NAME="${arg#*=}"
            ;;
        --old-user=*)
            OLD_DB_USER="${arg#*=}"
            ;;
        --old-password=*)
            OLD_DB_PASSWORD="${arg#*=}"
            ;;
        --new-host=*)
            NEW_DB_HOST="${arg#*=}"
            ;;
        --new-port=*)
            NEW_DB_PORT="${arg#*=}"
            ;;
        --new-db=*)
            NEW_DB_NAME="${arg#*=}"
            ;;
        --new-user=*)
            NEW_DB_USER="${arg#*=}"
            ;;
        --new-password=*)
            NEW_DB_PASSWORD="${arg#*=}"
            ;;
        --old-container=*)
            OLD_DOCKER_CONTAINER="${arg#*=}"
            ;;
        --new-container=*)
            NEW_DOCKER_CONTAINER="${arg#*=}"
            ;;
        --backup-file=*)
            BACKUP_FILE="${arg#*=}"
            ;;
        --dry-run)
            DRY_RUN=true
            ;;
        --verbose)
            VERBOSE=true
            ;;
        --help)
            print_usage
            exit 0
            ;;
        *)
            log_error "Unknown option: $arg"
            print_usage
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$MIGRATION_MODE" ]; then
    log_error "Migration mode is required. Use --mode=pgdump, --mode=direct, or --mode=docker"
    print_usage
    exit 1
fi

if [ -z "$OLD_DB_NAME" ] || [ -z "$OLD_DB_USER" ]; then
    log_error "Old database name and username are required"
    print_usage
    exit 1
fi

# Set defaults based on mode
case $MIGRATION_MODE in
    docker)
        if [ -z "$OLD_DOCKER_CONTAINER" ] || [ -z "$NEW_DOCKER_CONTAINER" ]; then
            log_error "Docker container names are required for docker mode"
            exit 1
        fi
        OLD_DB_HOST="localhost"
        NEW_DB_HOST="localhost"
        ;;
    pgdump)
        if [ -z "$BACKUP_FILE" ]; then
            BACKUP_FILE="/tmp/users_migration_$(date +%Y%m%d_%H%M%S).sql"
        fi
        ;;
esac

# Function to execute SQL on old database
exec_old_db() {
    local sql="$1"
    case $MIGRATION_MODE in
        docker)
            if [ "$DRY_RUN" = true ]; then
                verbose_log "Would execute on old DB: $sql"
                return 0
            fi
            docker exec -i "$OLD_DOCKER_CONTAINER" psql -U "$OLD_DB_USER" -d "$OLD_DB_NAME" -c "$sql"
            ;;
        *)
            if [ "$DRY_RUN" = true ]; then
                verbose_log "Would execute on old DB: $sql"
                return 0
            fi
            PGPASSWORD="$OLD_DB_PASSWORD" psql -h "$OLD_DB_HOST" -p "$OLD_DB_PORT" -U "$OLD_DB_USER" -d "$OLD_DB_NAME" -c "$sql"
            ;;
    esac
}

# Function to execute SQL on new database
exec_new_db() {
    local sql="$1"
    case $MIGRATION_MODE in
        docker)
            if [ "$DRY_RUN" = true ]; then
                verbose_log "Would execute on new DB: $sql"
                return 0
            fi
            docker exec -i "$NEW_DOCKER_CONTAINER" psql -U "$NEW_DB_USER" -d "$NEW_DB_NAME" -c "$sql"
            ;;
        *)
            if [ "$DRY_RUN" = true ]; then
                verbose_log "Would execute on new DB: $sql"
                return 0
            fi
            PGPASSWORD="$NEW_DB_PASSWORD" psql -h "$NEW_DB_HOST" -p "$NEW_DB_PORT" -U "$NEW_DB_USER" -d "$NEW_DB_NAME" -c "$sql"
            ;;
    esac
}

# Function to test database connections
test_connections() {
    log_info "Testing database connections..."
    
    case $MIGRATION_MODE in
        docker)
            verbose_log "Testing old database container: $OLD_DOCKER_CONTAINER"
            if ! docker exec "$OLD_DOCKER_CONTAINER" psql -U "$OLD_DB_USER" -d "$OLD_DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
                log_error "Cannot connect to old database container: $OLD_DOCKER_CONTAINER"
                exit 1
            fi
            
            verbose_log "Testing new database container: $NEW_DOCKER_CONTAINER"
            if ! docker exec "$NEW_DOCKER_CONTAINER" psql -U "$NEW_DB_USER" -d "$NEW_DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
                log_error "Cannot connect to new database container: $NEW_DOCKER_CONTAINER"
                exit 1
            fi
            ;;
        *)
            verbose_log "Testing old database connection: $OLD_DB_HOST:$OLD_DB_PORT/$OLD_DB_NAME"
            if ! PGPASSWORD="$OLD_DB_PASSWORD" psql -h "$OLD_DB_HOST" -p "$OLD_DB_PORT" -U "$OLD_DB_USER" -d "$OLD_DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
                log_error "Cannot connect to old database: $OLD_DB_HOST:$OLD_DB_PORT/$OLD_DB_NAME"
                exit 1
            fi
            
            verbose_log "Testing new database connection: $NEW_DB_HOST:$NEW_DB_PORT/$NEW_DB_NAME"
            if ! PGPASSWORD="$NEW_DB_PASSWORD" psql -h "$NEW_DB_HOST" -p "$NEW_DB_PORT" -U "$NEW_DB_USER" -d "$NEW_DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
                log_error "Cannot connect to new database: $NEW_DB_HOST:$NEW_DB_PORT/$NEW_DB_NAME"
                exit 1
            fi
            ;;
    esac
    
    log_success "Database connections successful"
}

# Function to detect old schema structure
detect_old_schema() {
    log_info "Detecting old database schema..."
    
    # Try to detect common user table structures
    local tables_info=""
    case $MIGRATION_MODE in
        docker)
            tables_info=$(docker exec "$OLD_DOCKER_CONTAINER" psql -U "$OLD_DB_USER" -d "$OLD_DB_NAME" -t -c "
                SELECT table_name, column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name IN ('users', 'user', 'accounts', 'members') 
                ORDER BY table_name, ordinal_position;
            " 2>/dev/null || echo "")
            ;;
        *)
            tables_info=$(PGPASSWORD="$OLD_DB_PASSWORD" psql -h "$OLD_DB_HOST" -p "$OLD_DB_PORT" -U "$OLD_DB_USER" -d "$OLD_DB_NAME" -t -c "
                SELECT table_name, column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name IN ('users', 'user', 'accounts', 'members') 
                ORDER BY table_name, ordinal_position;
            " 2>/dev/null || echo "")
            ;;
    esac
    
    if [ -z "$tables_info" ]; then
        log_warning "No common user tables found. You may need to customize the migration script."
        return 1
    fi
    
    verbose_log "Found table structure:"
    verbose_log "$tables_info"
    
    return 0
}

# Function to create mapping SQL based on detected schema
create_migration_sql() {
    log_info "Creating migration SQL..."
    
    # This is a template that may need customization based on your old schema
    cat > "/tmp/migration_script.sql" << 'EOF'
-- User Migration Script
-- Customize this SQL based on your old database schema

-- Temporary table to hold migrated users
CREATE TEMP TABLE temp_migrated_users AS
SELECT 
    -- Map your old columns to new schema columns
    -- Customize these column mappings based on your old schema:
    
    UPPER(COALESCE(callsign, call_sign, call)) as callsign,  -- Adjust column name
    COALESCE(name, full_name, username) as name,             -- Adjust column name  
    LOWER(COALESCE(email, email_address)) as email,          -- Adjust column name
    COALESCE(password, password_hash, pass) as password_hash, -- Adjust column name
    true as is_active,                                       -- Set all as active
    EXTRACT(EPOCH FROM COALESCE(created_at, created, NOW()))::bigint as created_at,
    NULL::bigint as last_login_at,
    'en' as locale                                           -- Default locale
FROM old_users_table_name  -- Replace with your actual table name
WHERE callsign IS NOT NULL 
  AND email IS NOT NULL
  AND LENGTH(TRIM(callsign)) >= 3;

-- Insert into users table, handling conflicts
INSERT INTO users (callsign, name, email, password_hash, is_active, created_at, last_login_at, locale)
SELECT callsign, name, email, password_hash, is_active, created_at, last_login_at, locale
FROM temp_migrated_users
ON CONFLICT (callsign) DO NOTHING;  -- Skip duplicates

-- Show migration results
SELECT 
    (SELECT COUNT(*) FROM temp_migrated_users) as users_to_migrate,
    (SELECT COUNT(*) FROM users WHERE created_at >= (SELECT MIN(created_at) FROM temp_migrated_users)) as users_migrated;
EOF

    log_success "Migration SQL created at /tmp/migration_script.sql"
    
    if [ "$VERBOSE" = true ]; then
        log_info "Generated SQL:"
        cat "/tmp/migration_script.sql"
    fi
}

# Function to perform pg_dump migration
migrate_pgdump() {
    log_info "Starting pg_dump migration..."
    
    # First, export user data from old database
    log_info "Exporting user data to $BACKUP_FILE..."
    case $MIGRATION_MODE in
        docker)
            if [ "$DRY_RUN" = false ]; then
                docker exec "$OLD_DOCKER_CONTAINER" pg_dump -U "$OLD_DB_USER" -d "$OLD_DB_NAME" \
                    --data-only --table=users --table=user --table=accounts --table=members \
                    > "$BACKUP_FILE" 2>/dev/null || true
            fi
            ;;
        *)
            if [ "$DRY_RUN" = false ]; then
                PGPASSWORD="$OLD_DB_PASSWORD" pg_dump -h "$OLD_DB_HOST" -p "$OLD_DB_PORT" -U "$OLD_DB_USER" -d "$OLD_DB_NAME" \
                    --data-only --table=users --table=user --table=accounts --table=members \
                    > "$BACKUP_FILE" 2>/dev/null || true
            fi
            ;;
    esac
    
    if [ "$DRY_RUN" = false ] && [ ! -s "$BACKUP_FILE" ]; then
        log_warning "Backup file is empty. Creating custom export..."
        # Custom export logic here
        create_migration_sql
        exec_old_db "\copy ($(grep 'SELECT' /tmp/migration_script.sql | head -n 1)) TO '$BACKUP_FILE' CSV HEADER"
    fi
    
    log_success "Data exported to $BACKUP_FILE"
    
    # Then import to new database with transformation
    log_info "Importing transformed data to new database..."
    create_migration_sql
    
    if [ "$DRY_RUN" = false ]; then
        exec_new_db "$(cat /tmp/migration_script.sql)"
    fi
    
    log_success "Migration completed via pg_dump method"
}

# Function to perform direct migration
migrate_direct() {
    log_info "Starting direct database migration..."
    
    create_migration_sql
    
    # For direct migration, we need to modify the SQL to use foreign data wrapper or similar
    # For simplicity, we'll use a two-step process
    
    log_info "Extracting user data from old database..."
    local temp_data="/tmp/migration_data.csv"
    
    case $MIGRATION_MODE in
        docker)
            if [ "$DRY_RUN" = false ]; then
                docker exec "$OLD_DOCKER_CONTAINER" psql -U "$OLD_DB_USER" -d "$OLD_DB_NAME" -c "
                    \copy (
                        SELECT 
                            UPPER(COALESCE(callsign, call_sign, call)) as callsign,
                            COALESCE(name, full_name, username) as name,
                            LOWER(COALESCE(email, email_address)) as email,
                            COALESCE(password, password_hash, pass) as password_hash,
                            true as is_active,
                            EXTRACT(EPOCH FROM COALESCE(created_at, created, NOW()))::bigint as created_at,
                            NULL::bigint as last_login_at,
                            'en' as locale
                        FROM users  -- Adjust table name as needed
                        WHERE callsign IS NOT NULL 
                          AND email IS NOT NULL
                          AND LENGTH(TRIM(callsign)) >= 3
                    ) TO STDOUT CSV HEADER
                " > "$temp_data"
            fi
            ;;
        *)
            if [ "$DRY_RUN" = false ]; then
                PGPASSWORD="$OLD_DB_PASSWORD" psql -h "$OLD_DB_HOST" -p "$OLD_DB_PORT" -U "$OLD_DB_USER" -d "$OLD_DB_NAME" -c "
                    \copy (
                        SELECT 
                            UPPER(COALESCE(callsign, call_sign, call)) as callsign,
                            COALESCE(name, full_name, username) as name,
                            LOWER(COALESCE(email, email_address)) as email,
                            COALESCE(password, password_hash, pass) as password_hash,
                            true as is_active,
                            EXTRACT(EPOCH FROM COALESCE(created_at, created, NOW()))::bigint as created_at,
                            NULL::bigint as last_login_at,
                            'en' as locale
                        FROM users  -- Adjust table name as needed
                        WHERE callsign IS NOT NULL 
                          AND email IS NOT NULL
                          AND LENGTH(TRIM(callsign)) >= 3
                    ) TO STDOUT CSV HEADER
                " > "$temp_data"
            fi
            ;;
    esac
    
    log_info "Importing user data to new database..."
    if [ "$DRY_RUN" = false ]; then
        exec_new_db "\copy users (callsign, name, email, password_hash, is_active, created_at, last_login_at, locale) FROM '$temp_data' CSV HEADER"
        rm -f "$temp_data"
    fi
    
    log_success "Direct migration completed"
}

# Function to verify migration
verify_migration() {
    log_info "Verifying migration results..."
    
    local old_count=""
    local new_count=""
    
    old_count=$(exec_old_db "SELECT COUNT(*) FROM users;" 2>/dev/null | grep -E '^[0-9]+$' || echo "0")
    new_count=$(exec_new_db "SELECT COUNT(*) FROM users;" 2>/dev/null | grep -E '^[0-9]+$' || echo "0")
    
    log_info "Old database user count: $old_count"
    log_info "New database user count: $new_count"
    
    if [ "$new_count" -gt 0 ]; then
        log_success "Migration verification: $new_count users found in new database"
        
        # Show sample of migrated users
        verbose_log "Sample migrated users:"
        exec_new_db "SELECT callsign, name, email, is_active FROM users LIMIT 5;" 2>/dev/null || true
    else
        log_warning "No users found in new database. Check migration logs for issues."
    fi
}

# Main execution
main() {
    log_info "Starting user database migration..."
    log_info "Migration mode: $MIGRATION_MODE"
    
    if [ "$DRY_RUN" = true ]; then
        log_warning "DRY RUN mode - no actual changes will be made"
    fi
    
    # Test connections
    if [ "$DRY_RUN" = false ]; then
        test_connections
    fi
    
    # Detect old schema
    if [ "$DRY_RUN" = false ]; then
        detect_old_schema || log_warning "Could not auto-detect schema. You may need to customize the migration script."
    fi
    
    # Perform migration based on mode
    case $MIGRATION_MODE in
        pgdump)
            migrate_pgdump
            ;;
        direct|docker)
            migrate_direct
            ;;
        *)
            log_error "Unknown migration mode: $MIGRATION_MODE"
            exit 1
            ;;
    esac
    
    # Verify results
    if [ "$DRY_RUN" = false ]; then
        verify_migration
    fi
    
    log_success "User migration process completed!"
    
    if [ "$DRY_RUN" = false ]; then
        log_info "Next steps:"
        log_info "1. Verify migrated user data in the new database"
        log_info "2. Test user authentication with migrated accounts"
        log_info "3. Update any application-specific user settings"
        log_info "4. Consider sending email notifications to migrated users"
    fi
}

# Run main function
main "$@"