import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Prefer NEON_DATABASE_URL (shared across Replit + Vercel) over the
// runtime-managed Replit DATABASE_URL so both deployments hit the same DB.
const connectionString =
  process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "[DB] WARNING: No database URL found. " +
      "Set NEON_DATABASE_URL in your environment variables."
  );
}

let _pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: connectionString ?? "",
      ssl: { rejectUnauthorized: false },
      max: 3,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });

    _pool.on("error", (err) => {
      console.error("[DB] Pool error:", err.message);
    });
  }
  return _pool;
}

export const pool = getPool();
export const db = drizzle(pool, { schema });

// Ensure all required tables exist in the production database.
// This is a safety net for Vercel cold starts where the Neon DB may be
// missing tables that were added after the initial schema push.
export async function ensureSchema(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id        SERIAL PRIMARY KEY,
        message   TEXT NOT NULL,
        type      TEXT NOT NULL,
        is_read   BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS collection_tracking (
        id          SERIAL PRIMARY KEY,
        teacher_id  INTEGER NOT NULL UNIQUE REFERENCES users(id),
        amount      INTEGER NOT NULL DEFAULT 0,
        last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id),
        endpoint   TEXT NOT NULL UNIQUE,
        p256dh     TEXT NOT NULL,
        auth       TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS student_notifications (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id),
        message    TEXT NOT NULL,
        type       TEXT NOT NULL,
        url        TEXT NOT NULL DEFAULT '/',
        is_read    BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("[DB] ensureSchema: all tables ready.");
  } catch (err: any) {
    console.error("[DB] ensureSchema failed:", err.message);
  } finally {
    client.release();
  }
}
