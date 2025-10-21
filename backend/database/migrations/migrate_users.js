#!/usr/bin/env node

/**
 * User Database Migration Script
 * Node.js version for easier Docker container integration
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const config = {
  oldDb: {
    host: process.env.OLD_DB_HOST || 'localhost',
    port: parseInt(process.env.OLD_DB_PORT || '5432'),
    database: process.env.OLD_DB_NAME || '',
    user: process.env.OLD_DB_USER || '',
    password: process.env.OLD_DB_PASSWORD || '',
  },
  newDb: {
    host: process.env.NEW_DB_HOST || 'localhost', 
    port: parseInt(process.env.NEW_DB_PORT || '5432'),
    database: process.env.NEW_DB_NAME || 'bm_lastheard',
    user: process.env.NEW_DB_USER || 'postgres',
    password: process.env.NEW_DB_PASSWORD || '',
  },
  dryRun: process.env.DRY_RUN === 'true',
  verbose: process.env.VERBOSE === 'true',
  backupFile: process.env.BACKUP_FILE || `/tmp/users_migration_${Date.now()}.json`,
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.reset;
  console.log(`${color}[${level.toUpperCase()}] ${timestamp}${colors.reset} ${message}`);
}

function logInfo(message) { log('blue', message); }
function logSuccess(message) { log('green', message); }
function logWarning(message) { log('yellow', message); }
function logError(message) { log('red', message); }
function logVerbose(message) { if (config.verbose) log('blue', `[VERBOSE] ${message}`); }

async function testConnection(dbConfig, name) {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
    logSuccess(`${name} database connection successful`);
    return true;
  } catch (error) {
    logError(`${name} database connection failed: ${error.message}`);
    return false;
  }
}

async function detectOldSchema(client) {
  logInfo('Detecting old database schema...');
  
  try {
    // Try to find user-related tables
    const tablesQuery = `
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name ILIKE ANY(ARRAY['%user%', '%account%', '%member%', '%profile%'])
        AND table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `;
    
    const result = await client.query(tablesQuery);
    
    if (result.rows.length === 0) {
      logWarning('No user-related tables found. You may need to customize the migration.');
      return null;
    }
    
    // Group by table name
    const tables = {};
    result.rows.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push(row);
    });
    
    logInfo(`Found ${Object.keys(tables).length} potential user table(s):`);
    Object.keys(tables).forEach(tableName => {
      logInfo(`  - ${tableName} (${tables[tableName].length} columns)`);
      if (config.verbose) {
        tables[tableName].forEach(col => {
          logVerbose(`    ${col.column_name}: ${col.data_type}`);
        });
      }
    });
    
    return tables;
  } catch (error) {
    logError(`Error detecting schema: ${error.message}`);
    return null;
  }
}

function generateMigrationQuery(tableStructure) {
  // Try to auto-detect column mappings
  const commonMappings = {
    callsign: ['callsign', 'call_sign', 'call', 'amateur_callsign', 'ham_call'],
    name: ['name', 'full_name', 'username', 'display_name', 'first_name'],
    email: ['email', 'email_address', 'mail', 'e_mail'],
    password: ['password', 'password_hash', 'passwd', 'pass', 'pwd_hash'],
    created_at: ['created_at', 'created', 'creation_date', 'date_created', 'register_date'],
  };
  
  function findColumn(tableCols, possibleNames) {
    return tableCols.find(col => 
      possibleNames.some(name => 
        col.column_name.toLowerCase().includes(name.toLowerCase())
      )
    );
  }
  
  // Find the most likely user table (one with email and callsign/name)
  let bestTable = null;
  let bestScore = 0;
  
  Object.entries(tableStructure).forEach(([tableName, columns]) => {
    let score = 0;
    if (findColumn(columns, commonMappings.email)) score += 3;
    if (findColumn(columns, commonMappings.callsign)) score += 3;
    if (findColumn(columns, commonMappings.name)) score += 2;
    if (findColumn(columns, commonMappings.password)) score += 1;
    
    if (score > bestScore) {
      bestScore = score;
      bestTable = { name: tableName, columns };
    }
  });
  
  if (!bestTable) {
    logError('Could not auto-detect appropriate user table structure');
    return null;
  }
  
  logInfo(`Using table: ${bestTable.name} (score: ${bestScore})`);
  
  // Build column mappings
  const mappings = {};
  Object.entries(commonMappings).forEach(([targetCol, sourceOptions]) => {
    const found = findColumn(bestTable.columns, sourceOptions);
    if (found) {
      mappings[targetCol] = found.column_name;
      logVerbose(`Mapped ${targetCol} -> ${found.column_name}`);
    }
  });
  
  // Generate SQL query
  const selectParts = [
    mappings.callsign ? `UPPER(TRIM(${mappings.callsign})) as callsign` : `'UNKNOWN' as callsign`,
    mappings.name ? `TRIM(${mappings.name}) as name` : `'User' as name`,
    mappings.email ? `LOWER(TRIM(${mappings.email})) as email` : `'unknown@example.com' as email`,
    mappings.password ? `${mappings.password} as password_hash` : `'changeme' as password_hash`,
    `true as is_active`,
    mappings.created_at ? 
      `CASE WHEN ${mappings.created_at} IS NOT NULL THEN EXTRACT(EPOCH FROM ${mappings.created_at})::bigint ELSE EXTRACT(EPOCH FROM NOW())::bigint END as created_at` :
      `EXTRACT(EPOCH FROM NOW())::bigint as created_at`,
    `NULL::bigint as last_login_at`,
    `'en' as locale`
  ];
  
  const whereConditions = [];
  if (mappings.callsign) {
    whereConditions.push(`${mappings.callsign} IS NOT NULL`);
    whereConditions.push(`LENGTH(TRIM(${mappings.callsign})) >= 3`);
  }
  if (mappings.email) {
    whereConditions.push(`${mappings.email} IS NOT NULL`);
    whereConditions.push(`${mappings.email} LIKE '%@%'`);
  }
  
  const query = `
    SELECT ${selectParts.join(',\n       ')}
    FROM ${bestTable.name}
    ${whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : ''}
    ORDER BY ${mappings.created_at || mappings.callsign || '1'}
  `;
  
  return { query, tableName: bestTable.name, mappings };
}

async function exportUsers(oldClient, migrationInfo) {
  logInfo('Exporting users from old database...');
  
  try {
    const result = await oldClient.query(migrationInfo.query);
    
    if (result.rows.length === 0) {
      logWarning('No users found to migrate');
      return [];
    }
    
    logSuccess(`Found ${result.rows.length} users to migrate`);
    
    // Save backup
    if (!config.dryRun) {
      fs.writeFileSync(config.backupFile, JSON.stringify(result.rows, null, 2));
      logInfo(`Backup saved to: ${config.backupFile}`);
    }
    
    if (config.verbose) {
      logVerbose('Sample user data:');
      result.rows.slice(0, 3).forEach((user, index) => {
        logVerbose(`  ${index + 1}. ${user.callsign} - ${user.name} (${user.email})`);
      });
    }
    
    return result.rows;
  } catch (error) {
    logError(`Error exporting users: ${error.message}`);
    throw error;
  }
}

async function importUsers(newClient, users) {
  logInfo(`Importing ${users.length} users to new database...`);
  
  if (config.dryRun) {
    logInfo('DRY RUN: Would import users but not actually executing');
    return { imported: 0, skipped: 0, errors: 0 };
  }
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  try {
    await newClient.query('BEGIN');
    
    for (const user of users) {
      try {
        const insertQuery = `
          INSERT INTO users (callsign, name, email, password_hash, is_active, created_at, last_login_at, locale)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (callsign) DO NOTHING
          RETURNING id
        `;
        
        const result = await newClient.query(insertQuery, [
          user.callsign,
          user.name,
          user.email,
          user.password_hash,
          user.is_active,
          user.created_at,
          user.last_login_at,
          user.locale
        ]);
        
        if (result.rows.length > 0) {
          imported++;
          logVerbose(`Imported: ${user.callsign}`);
        } else {
          skipped++;
          logVerbose(`Skipped (duplicate): ${user.callsign}`);
        }
      } catch (error) {
        errors++;
        logError(`Error importing user ${user.callsign}: ${error.message}`);
      }
    }
    
    await newClient.query('COMMIT');
    
    logSuccess(`Import completed: ${imported} imported, ${skipped} skipped, ${errors} errors`);
    
    return { imported, skipped, errors };
  } catch (error) {
    await newClient.query('ROLLBACK');
    logError(`Transaction failed: ${error.message}`);
    throw error;
  }
}

async function verifyMigration(newClient) {
  logInfo('Verifying migration results...');
  
  try {
    const countResult = await newClient.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(countResult.rows[0].count);
    
    logInfo(`Total users in new database: ${totalUsers}`);
    
    if (totalUsers > 0) {
      // Show sample users
      const sampleResult = await newClient.query(`
        SELECT callsign, name, email, is_active, 
               TO_TIMESTAMP(created_at) as created_at
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 5
      `);
      
      logSuccess('Recent migrated users:');
      sampleResult.rows.forEach((user, index) => {
        logInfo(`  ${index + 1}. ${user.callsign} - ${user.name} (${user.email}) - ${user.created_at}`);
      });
    }
    
    return totalUsers;
  } catch (error) {
    logError(`Error verifying migration: ${error.message}`);
    return 0;
  }
}

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function main() {
  logInfo('Starting user database migration...');
  
  // Validate configuration
  if (!config.oldDb.database || !config.oldDb.user) {
    logError('Old database configuration is incomplete. Set OLD_DB_NAME and OLD_DB_USER environment variables.');
    process.exit(1);
  }
  
  if (config.dryRun) {
    logWarning('DRY RUN mode - no actual changes will be made');
  }
  
  logInfo(`Old DB: ${config.oldDb.host}:${config.oldDb.port}/${config.oldDb.database}`);
  logInfo(`New DB: ${config.newDb.host}:${config.newDb.port}/${config.newDb.database}`);
  
  let oldClient, newClient;
  
  try {
    // Test connections
    logInfo('Testing database connections...');
    
    const oldConnOk = await testConnection(config.oldDb, 'Old');
    const newConnOk = await testConnection(config.newDb, 'New');
    
    if (!oldConnOk || !newConnOk) {
      logError('Database connection test failed');
      process.exit(1);
    }
    
    // Connect to databases
    oldClient = new Client(config.oldDb);
    newClient = new Client(config.newDb);
    
    await oldClient.connect();
    await newClient.connect();
    
    // Detect schema
    const tableStructure = await detectOldSchema(oldClient);
    if (!tableStructure) {
      logError('Could not detect database schema');
      process.exit(1);
    }
    
    // Generate migration query
    const migrationInfo = generateMigrationQuery(tableStructure);
    if (!migrationInfo) {
      logError('Could not generate migration query');
      process.exit(1);
    }
    
    logInfo('Generated migration query:');
    logVerbose(migrationInfo.query);
    
    // Ask for confirmation if not in dry run mode
    if (!config.dryRun) {
      const answer = await promptUser('Proceed with migration? (y/N): ');
      if (answer !== 'y' && answer !== 'yes') {
        logInfo('Migration cancelled by user');
        process.exit(0);
      }
    }
    
    // Export users
    const users = await exportUsers(oldClient, migrationInfo);
    
    if (users.length === 0) {
      logInfo('No users to migrate');
      process.exit(0);
    }
    
    // Import users
    const importResults = await importUsers(newClient, users);
    
    // Verify migration
    const totalUsers = await verifyMigration(newClient);
    
    logSuccess('Migration completed successfully!');
    logInfo(`Summary: ${importResults.imported} imported, ${importResults.skipped} skipped, ${importResults.errors} errors`);
    
    if (!config.dryRun) {
      logInfo('\nNext steps:');
      logInfo('1. Test user authentication with migrated accounts');
      logInfo('2. Update any application-specific user settings');
      logInfo('3. Consider notifying users about the migration');
      logInfo(`4. Backup file saved at: ${config.backupFile}`);
    }
    
  } catch (error) {
    logError(`Migration failed: ${error.message}`);
    if (config.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    if (oldClient) await oldClient.end();
    if (newClient) await newClient.end();
  }
}

// Usage information
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
User Database Migration Script

USAGE:
  node migrate_users.js [options]

ENVIRONMENT VARIABLES:
  OLD_DB_HOST         Old database host (default: localhost)
  OLD_DB_PORT         Old database port (default: 5432)
  OLD_DB_NAME         Old database name (required)
  OLD_DB_USER         Old database username (required)
  OLD_DB_PASSWORD     Old database password
  
  NEW_DB_HOST         New database host (default: localhost)
  NEW_DB_PORT         New database port (default: 5432)
  NEW_DB_NAME         New database name (default: bm_lastheard)
  NEW_DB_USER         New database username (default: postgres)
  NEW_DB_PASSWORD     New database password
  
  DRY_RUN            Set to 'true' for dry run mode (default: false)
  VERBOSE            Set to 'true' for verbose output (default: false)
  BACKUP_FILE        Path for backup file (default: /tmp/users_migration_[timestamp].json)

EXAMPLES:

  # Basic migration
  OLD_DB_NAME=old_bm_db OLD_DB_USER=postgres node migrate_users.js
  
  # Dry run with verbose output
  DRY_RUN=true VERBOSE=true OLD_DB_NAME=old_bm_db OLD_DB_USER=postgres node migrate_users.js
  
  # Migration with custom settings
  OLD_DB_HOST=oldserver.com OLD_DB_NAME=legacy_db OLD_DB_USER=admin \\
  NEW_DB_HOST=newserver.com NEW_DB_PASSWORD=secret \\
  node migrate_users.js

DOCKER EXAMPLES:

  # Run from host against Docker containers
  docker exec -e OLD_DB_NAME=old_db -e OLD_DB_USER=postgres old_container \\
    node /path/to/migrate_users.js
  
  # Copy script to container and run
  docker cp migrate_users.js new_container:/tmp/
  docker exec -e OLD_DB_HOST=old_container -e OLD_DB_NAME=old_db \\
    new_container node /tmp/migrate_users.js
`);
  process.exit(0);
}

// Run the migration
main().catch(error => {
  logError(`Unexpected error: ${error.message}`);
  process.exit(1);
});