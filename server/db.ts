import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "[DB] WARNING: DATABASE_URL is not set. " +
      "Add it in Vercel → Project Settings → Environment Variables."
  );
}

// Singleton pool — reused across serverless invocations in the same container.
// max: 3 keeps connection count low for serverless/Supabase pooler limits.
let _pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: connectionString ?? "",
      ssl: connectionString ? { rejectUnauthorized: false } : false,
      max: 3,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
    });

    _pool.on("error", (err) => {
      console.error("[DB] Idle pool client error:", err.message);
    });
  }
  return _pool;
}

export const pool = getPool();
export const db = drizzle(pool, { schema });
