#!/bin/bash

# Docker Migration Helper Script
# Simplifies migration between Docker containers

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

print_usage() {
    cat << EOF
Docker Migration Helper

USAGE:
    $0 OLD_CONTAINER NEW_CONTAINER OLD_DB_NAME [OPTIONS]

ARGUMENTS:
    OLD_CONTAINER    Name of the old database container
    NEW_CONTAINER    Name of the new database container  
    OLD_DB_NAME      Name of the old database

OPTIONS:
    --old-user=USER       Old database username (default: postgres)
    --old-password=PASS   Old database password
    --new-user=USER       New database username (default: postgres)
    --new-password=PASS   New database password
    --new-db=NAME         New database name (default: bm_lastheard)
    --dry-run             Test migration without making changes
    --verbose             Show detailed output

EXAMPLES:
    # Basic migration
    $0 old_db_container new_db_container old_bm_database

    # With custom settings
    $0 old_db new_db legacy_bm --old-user=admin --new-password=secret --verbose

    # Dry run first
    $0 old_db new_db legacy_bm --dry-run --verbose
EOF
}

# Default values
OLD_USER="postgres"
OLD_PASSWORD=""
NEW_USER="postgres"  
NEW_PASSWORD=""
NEW_DB="bm_lastheard"
DRY_RUN=""
VERBOSE=""

# Parse arguments
if [ $# -lt 3 ]; then
    log_error "Missing required arguments"
    print_usage
    exit 1
fi

OLD_CONTAINER="$1"
NEW_CONTAINER="$2"
OLD_DB_NAME="$3"
shift 3

# Parse options
for arg in "$@"; do
    case $arg in
        --old-user=*)
            OLD_USER="${arg#*=}"
            ;;
        --old-password=*)
            OLD_PASSWORD="${arg#*=}"
            ;;
        --new-user=*)
            NEW_USER="${arg#*=}"
            ;;
        --new-password=*)
            NEW_PASSWORD="${arg#*=}"
            ;;
        --new-db=*)
            NEW_DB="${arg#*=}"
            ;;
        --dry-run)
            DRY_RUN="true"
            ;;
        --verbose)
            VERBOSE="true"
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

log_info "Docker Migration Helper"
log_info "Old container: $OLD_CONTAINER"
log_info "New container: $NEW_CONTAINER"
log_info "Old database: $OLD_DB_NAME"
log_info "New database: $NEW_DB"

if [ "$DRY_RUN" = "true" ]; then
    log_warning "DRY RUN mode enabled"
fi

# Check if containers exist and are running
log_info "Checking Docker containers..."

if ! docker ps --format "table {{.Names}}" | grep -q "^${OLD_CONTAINER}$"; then
    log_error "Old container '$OLD_CONTAINER' is not running"
    exit 1
fi

if ! docker ps --format "table {{.Names}}" | grep -q "^${NEW_CONTAINER}$"; then
    log_error "New container '$NEW_CONTAINER' is not running"
    exit 1
fi

log_success "Both containers are running"

# Check if migration script exists
SCRIPT_DIR="$(dirname "$0")"
MIGRATION_SCRIPT="$SCRIPT_DIR/migrate_users.js"

if [ ! -f "$MIGRATION_SCRIPT" ]; then
    log_error "Migration script not found: $MIGRATION_SCRIPT"
    exit 1
fi

# Copy migration script to new container
log_info "Copying migration script to container..."
docker cp "$MIGRATION_SCRIPT" "$NEW_CONTAINER:/tmp/migrate_users.js"

# Check if pg module is available, install if needed
log_info "Checking Node.js dependencies..."
if ! docker exec "$NEW_CONTAINER" node -e "require('pg')" 2>/dev/null; then
    log_info "Installing pg module..."
    docker exec "$NEW_CONTAINER" sh -c "cd /tmp && npm install pg"
fi

# Prepare environment variables
ENV_VARS=""
ENV_VARS="$ENV_VARS -e OLD_DB_HOST=$OLD_CONTAINER"
ENV_VARS="$ENV_VARS -e OLD_DB_NAME=$OLD_DB_NAME"
ENV_VARS="$ENV_VARS -e OLD_DB_USER=$OLD_USER"
ENV_VARS="$ENV_VARS -e NEW_DB_NAME=$NEW_DB"
ENV_VARS="$ENV_VARS -e NEW_DB_USER=$NEW_USER"

if [ -n "$OLD_PASSWORD" ]; then
    ENV_VARS="$ENV_VARS -e OLD_DB_PASSWORD=$OLD_PASSWORD"
fi

if [ -n "$NEW_PASSWORD" ]; then
    ENV_VARS="$ENV_VARS -e NEW_DB_PASSWORD=$NEW_PASSWORD"
fi

if [ "$DRY_RUN" = "true" ]; then
    ENV_VARS="$ENV_VARS -e DRY_RUN=true"
fi

if [ "$VERBOSE" = "true" ]; then
    ENV_VARS="$ENV_VARS -e VERBOSE=true"
fi

# Run the migration
log_info "Starting migration..."
log_info "Command: docker exec $ENV_VARS $NEW_CONTAINER node /tmp/migrate_users.js"

if docker exec $ENV_VARS "$NEW_CONTAINER" node /tmp/migrate_users.js; then
    log_success "Migration completed successfully!"
    
    if [ "$DRY_RUN" != "true" ]; then
        log_info "Cleaning up..."
        docker exec "$NEW_CONTAINER" rm -f /tmp/migrate_users.js
        
        log_info "Next steps:"
        log_info "1. Test user authentication with migrated accounts"
        log_info "2. Verify user data in the new database"
        log_info "3. Consider sending notifications to migrated users"
    fi
else
    log_error "Migration failed!"
    log_info "The migration script is still available at /tmp/migrate_users.js in the container"
    log_info "You can examine logs and retry with: docker exec $NEW_CONTAINER node /tmp/migrate_users.js"
    exit 1
fi