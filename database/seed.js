#!/usr/bin/env node
/**
 * CAMPUSHUB DATABASE SEED SCRIPT
 * Run via: npm run db:seed or node database/seed.js
 */

const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, 'campus_hub.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH = path.join(__dirname, 'seed.sql');

console.log('⚡ [CAMPUSHUB DB] Starting database initialization...');

// Remove old database file if fresh reset is desired
if (fs.existsSync(DB_PATH)) {
  console.log('📦 [CAMPUSHUB DB] Updating existing database file: campus_hub.db');
} else {
  console.log('📦 [CAMPUSHUB DB] Creating new database file: campus_hub.db');
}

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

console.log('📄 [CAMPUSHUB DB] Applying relational schema (schema.sql)...');
const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schemaSql);

console.log('🌱 [CAMPUSHUB DB] Seeding verified campus datasets (seed.sql)...');
const seedSql = fs.readFileSync(SEED_PATH, 'utf-8');
db.exec(seedSql);

// Verification count
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
const teamCount = db.prepare('SELECT COUNT(*) as count FROM teams').get().count;
const commCount = db.prepare('SELECT COUNT(*) as count FROM communities').get().count;
const discCount = db.prepare('SELECT COUNT(*) as count FROM discussions').get().count;
const eventCount = db.prepare('SELECT COUNT(*) as count FROM events').get().count;
const prodCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;

console.log('✅ [CAMPUSHUB DB] Seed completed successfully!');
console.log(`📊 Statistics:
  • Users:         ${userCount}
  • Teams:         ${teamCount}
  • Communities:   ${commCount}
  • Discussions:   ${discCount}
  • Events:        ${eventCount}
  • Products:      ${prodCount}
`);

db.close();
