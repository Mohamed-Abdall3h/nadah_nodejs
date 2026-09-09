const path = require('path');
const { createClient } = require('@libsql/client');

// ─────────────────────────────────────────────
//  DATABASE CONNECTION
// ─────────────────────────────────────────────
// Locally (no env vars set): uses a plain SQLite file on disk.
// In production on a free host (Render, etc.), point these two env vars
// at a free Turso database instead — same code, same queries, but the
// data lives outside the server's disk so it survives redeploys/restarts:
//
//   TURSO_DATABASE_URL=libsql://your-db-name.turso.io
//   TURSO_AUTH_TOKEN=<token from `turso db tokens create`>
//
const url = process.env.TURSO_DATABASE_URL || `file:${path.join(__dirname, 'nabdh.db')}`;
const authToken = process.env.TURSO_AUTH_TOKEN; // undefined is fine for local file mode

const client = createClient({ url, authToken });

async function init() {
  const statements = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_premium    INTEGER NOT NULL DEFAULT 0,
  role          TEXT NOT NULL DEFAULT 'user',
  premium_expires_at TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  icon  TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sources (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL,
  color        TEXT NOT NULL,
  initials     TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS articles (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  body         TEXT,
  category_key TEXT NOT NULL,
  category_name TEXT NOT NULL,
  source_id    TEXT,
  image_url    TEXT,
  is_breaking  INTEGER NOT NULL DEFAULT 0,
  is_featured  INTEGER NOT NULL DEFAULT 0,
  published_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS premium_plans (
  id             TEXT PRIMARY KEY,
  period         TEXT NOT NULL,
  price          REAL NOT NULL,
  original_price REAL,
  saving_label   TEXT,
  is_featured    INTEGER NOT NULL DEFAULT 0,
  duration_days  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_subscriptions (
  user_id   INTEGER NOT NULL,
  source_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, source_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id    INTEGER NOT NULL,
  article_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, article_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_articles (
  user_id    INTEGER NOT NULL,
  article_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, article_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS premium_purchases (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  plan_id     TEXT NOT NULL,
  price_paid  REAL NOT NULL,
  starts_at   TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES premium_plans(id)
);
`.split(';').map(s => s.trim()).filter(Boolean);

  for (const stmt of statements) { await client.execute(stmt); }
  // Safe migration for databases created before admin roles existed.
  try { await client.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'"); } catch (_) {}
}

// ── Thin helpers so route code stays close to plain SQL ──
// get(sql, args)  -> single row or undefined
// all(sql, args)  -> array of rows
// run(sql, args)  -> { lastInsertRowid, changes }
async function get(sql, args = []) {
  const res = await client.execute({ sql, args });
  return res.rows[0];
}

async function all(sql, args = []) {
  const res = await client.execute({ sql, args });
  return res.rows;
}

async function run(sql, args = []) {
  const res = await client.execute({ sql, args });
  return { lastInsertRowid: res.lastInsertRowid, changes: res.rowsAffected };
}

module.exports = { client, init, get, all, run };
