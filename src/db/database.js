'use strict';
const { DatabaseSync } = require('node:sqlite');
const { DATABASE_PATH } = require('../env.js');

function migrate(db) {
  db.exec('PRAGMA journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      discord_id   TEXT PRIMARY KEY,
      mc_uuid      TEXT NOT NULL UNIQUE,
      mc_username  TEXT NOT NULL,
      link_method  TEXT NOT NULL DEFAULT 'social',
      linked_at    INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS stars_cache (
      mc_username_lower TEXT PRIMARY KEY,
      mc_username       TEXT NOT NULL,
      mc_uuid           TEXT,
      stars             INTEGER NOT NULL DEFAULT 0,
      source            TEXT NOT NULL DEFAULT 'api',
      updated_at        INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_stars_uuid ON stars_cache(mc_uuid);
    CREATE TABLE IF NOT EXISTS guild_config (
      guild_id              TEXT PRIMARY KEY,
      scan_enabled          INTEGER NOT NULL DEFAULT 1,
      scan_channel_id       TEXT,
      nickname_sync_enabled INTEGER NOT NULL DEFAULT 1,
      locale_override       TEXT
    );
  `);
}

let _db = null;
function getDb() {
  if (_db) return _db;
  _db = new DatabaseSync(DATABASE_PATH);
  migrate(_db);
  return _db;
}

module.exports = { getDb, migrate };
