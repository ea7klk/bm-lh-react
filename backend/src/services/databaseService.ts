import fs from 'fs';
import path from 'path';
import pool from '../config/database';
import { QueryResult } from 'pg';

export class DatabaseService {
  async query(text: string, params?: any[]): Promise<QueryResult> {
    try {
      return await pool.query(text, params);
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
}

export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    await pool.query(schema);
    
    console.log('Database initialized successfully');
  } catch (error: any) {
    console.error('Error initializing database:', error.message);
    
    // If table already exists, that's fine
    if (error.message.includes('already exists')) {
      console.log('Database tables already exist, skipping initialization');
      return;
    }
    
    // For other errors, we can continue with mock data
    console.log('Continuing with mock data fallback');
  }
}