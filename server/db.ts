import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "#shared/schema.js";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "[DB] WARNING: DATABASE_URL is not set. " +
      "Add it in Vercel → Project Settings → Environment Variables."
  );
}

let _pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!_pool) {
    // Use connection string as-is - don't modify it
    // The SSL warning is informational and doesn't affect functionality
    _pool = new Pool({
      connectionString: connectionString ?? "",
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
