import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

// Using a local file database
export const db = new Database('database.sqlite');

// Enable foreign keys
db.pragma('foreign_keys = ON');
// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Simple migration runner for local testing
export function migrate() {
  const schemaPath = join(import.meta.dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('Database migrated.');
}
