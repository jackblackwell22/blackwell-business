import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { LANDLORDS, SEEDED_LOCK_UP_LABELS } from "./constants";
import { isoNow } from "./london";

type GlobalDb = typeof globalThis & { __blackwellDb?: Database.Database };

function dataDirectory() {
  if (process.env.DATABASE_PATH?.trim()) {
    return path.dirname(path.resolve(process.env.DATABASE_PATH.trim()));
  }
  return path.join(process.cwd(), "data");
}

export function getDataDir() {
  const dir = dataDirectory();
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getDatabasePath() {
  if (process.env.DATABASE_PATH?.trim()) {
    return path.resolve(process.env.DATABASE_PATH.trim());
  }
  return path.join(getDataDir(), "blackwell.sqlite");
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS landlords (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      postal_address TEXT NOT NULL DEFAULT '',
      bacs_account_name TEXT NOT NULL DEFAULT '',
      bacs_sort_code TEXT NOT NULL DEFAULT '',
      bacs_account_number TEXT NOT NULL DEFAULT '',
      from_email TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      label TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT '',
      landlord_id TEXT REFERENCES landlords(id),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tenancies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id),
      property_id INTEGER NOT NULL REFERENCES properties(id),
      rent_pence INTEGER NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS one_active_tenancy
      ON tenancies(property_id) WHERE ended_at IS NULL;

    CREATE TABLE IF NOT EXISTS enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL REFERENCES tenants(id),
      landlord_id TEXT NOT NULL REFERENCES landlords(id),
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      payment_reference TEXT NOT NULL UNIQUE,
      total_pence INTEGER NOT NULL,
      pdf_relpath TEXT NOT NULL,
      emailed_at TEXT,
      email_error TEXT,
      created_at TEXT NOT NULL,
      UNIQUE(tenant_id, landlord_id, year, month)
    );

    CREATE TABLE IF NOT EXISTS invoice_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      property_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      amount_pence INTEGER NOT NULL
    );
  `);

  const insertLandlord = db.prepare(
    `INSERT OR IGNORE INTO landlords (id, name) VALUES (?, ?)`,
  );
  for (const landlord of LANDLORDS) {
    insertLandlord.run(landlord.id, landlord.name);
  }

  const existingLockUps = db
    .prepare(`SELECT label FROM properties WHERE type = 'lock-up'`)
    .all() as { label: string }[];
  const knownLabels = new Set(existingLockUps.map((row) => row.label));
  const insertProperty = db.prepare(
    `INSERT INTO properties (type, label, address, landlord_id, sort_order, created_at)
     VALUES ('lock-up', ?, '', NULL, ?, ?)`,
  );
  for (const label of SEEDED_LOCK_UP_LABELS) {
    if (knownLabels.has(label)) continue;
    insertProperty.run(label, Number(label), isoNow());
  }

  db.prepare(
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('accepting_enquiries', '1')`,
  ).run();
}

export function getDb() {
  const globalDb = globalThis as GlobalDb;
  if (globalDb.__blackwellDb) return globalDb.__blackwellDb;

  const file = getDatabasePath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  globalDb.__blackwellDb = db;
  return db;
}

export type LandlordRow = {
  id: string;
  name: string;
  postal_address: string;
  bacs_account_name: string;
  bacs_sort_code: string;
  bacs_account_number: string;
  from_email: string;
};

export type PropertyRow = {
  id: number;
  type: string;
  label: string;
  address: string;
  landlord_id: string | null;
  sort_order: number;
  created_at: string;
};

export type TenantRow = {
  id: number;
  name: string;
  email: string;
  notes: string;
  created_at: string;
};

export type TenancyRow = {
  id: number;
  tenant_id: number;
  property_id: number;
  rent_pence: number;
  started_at: string;
  ended_at: string | null;
};

export type EnquiryRow = {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  created_at: string;
};

export type InvoiceRow = {
  id: number;
  tenant_id: number;
  landlord_id: string;
  year: number;
  month: number;
  payment_reference: string;
  total_pence: number;
  pdf_relpath: string;
  emailed_at: string | null;
  email_error: string | null;
  created_at: string;
};
