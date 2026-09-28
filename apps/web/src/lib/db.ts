import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

// Node's built-in sqlite module (stable since Node 22.5+) — no native
// dependency to compile, which matters here: this machine hasn't accepted
// the Xcode CLT license, so anything needing node-gyp (e.g. better-sqlite3)
// would fail to install.
const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "dashboard.sqlite");

fs.mkdirSync(DATA_DIR, { recursive: true });

// Next.js dev (Turbopack/Fast Refresh) can re-evaluate this module on hot
// reload — stash the connection on globalThis so we don't reopen the file
// (and leak handles) on every edit, the same pattern used for Prisma clients
// in Next.js dev.
const globalForDb = globalThis as unknown as { __dashboardDb?: DatabaseSync };

export const db = globalForDb.__dashboardDb ?? new DatabaseSync(DB_FILE);
globalForDb.__dashboardDb = db;

db.exec(`
  CREATE TABLE IF NOT EXISTS chat_sessions (
    slug TEXT PRIMARY KEY,
    claude_session_id TEXT,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_chat_messages_slug ON chat_messages(slug);

  CREATE TABLE IF NOT EXISTS runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL,
    status TEXT NOT NULL,
    output TEXT NOT NULL,
    exit_code INTEGER,
    started_at TEXT NOT NULL,
    finished_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_runs_slug ON runs(slug);

  CREATE TABLE IF NOT EXISTS routines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL,
    frequency TEXT NOT NULL,
    time TEXT NOT NULL,
    day_of_week INTEGER,
    enabled INTEGER NOT NULL DEFAULT 1,
    last_fired_at TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_routines_enabled ON routines(enabled);
`);
