import * as SQLite from 'expo-sqlite';

const dbPromise = SQLite.openDatabaseAsync('freefeels.db');
let initialized = false;

type EntryRow = {
  id: number;
  text: string;
  created_at: string;
};

type ReminderRow = {
  id: number;
  hour: number;
  minute: number;
  enabled: number;
};

export type Entry = {
  id: number;
  text: string;
  createdAt: string;
};

export type Reminder = {
  id: number;
  hour: number;
  minute: number;
  enabled: boolean;
};

async function getDb() {
  return dbPromise;
}

export async function initDb() {
  if (initialized) {
    return;
  }

  const db = await getDb();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hour INTEGER NOT NULL,
      minute INTEGER NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1
    );
  `);

  initialized = true;
}

export async function insertEntry(text: string) {
  await initDb();
  const db = await getDb();
  const createdAt = new Date().toISOString();

  await db.runAsync('INSERT INTO entries (text, created_at) VALUES (?, ?);', text, createdAt);
}

export async function listEntries(): Promise<Entry[]> {
  await initDb();
  const db = await getDb();
  const rows = await db.getAllAsync<EntryRow>(
    'SELECT id, text, created_at FROM entries ORDER BY created_at DESC;',
  );

  return rows.map((row) => ({
    id: row.id,
    text: row.text,
    createdAt: row.created_at,
  }));
}

export async function deleteEntry(id: number) {
  await initDb();
  const db = await getDb();
  await db.runAsync('DELETE FROM entries WHERE id = ?;', id);
}

export async function listReminders(): Promise<Reminder[]> {
  await initDb();
  const db = await getDb();
  const rows = await db.getAllAsync<ReminderRow>(
    'SELECT id, hour, minute, enabled FROM reminders ORDER BY hour ASC, minute ASC, id ASC;',
  );

  return rows.map((row) => ({
    id: row.id,
    hour: row.hour,
    minute: row.minute,
    enabled: row.enabled === 1,
  }));
}

export async function addReminder(hour: number, minute: number, enabled = true) {
  await initDb();
  const db = await getDb();
  await db.runAsync('INSERT INTO reminders (hour, minute, enabled) VALUES (?, ?, ?);', hour, minute, enabled ? 1 : 0);
}

export async function removeReminder(id: number) {
  await initDb();
  const db = await getDb();
  await db.runAsync('DELETE FROM reminders WHERE id = ?;', id);
}

export async function setAllRemindersEnabled(enabled: boolean) {
  await initDb();
  const db = await getDb();
  await db.runAsync('UPDATE reminders SET enabled = ?;', enabled ? 1 : 0);
}
