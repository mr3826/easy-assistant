import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.mjs';
import { schemaSql } from './schema.mjs';

let sharedDatabase;

export function openDatabase() {
  if (sharedDatabase) {
    return sharedDatabase;
  }

  mkdirSync(dirname(config.databasePath), { recursive: true });

  const db = new DatabaseSync(config.databasePath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `);
  db.exec(schemaSql);

  sharedDatabase = db;
  return db;
}

export function withTransaction(db, work) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // Ignore rollback failures; the original error is the one that matters.
    }
    throw error;
  }
}
