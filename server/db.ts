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
    // Replace any existing sslmode with verify-full to avoid security warning
    let connStr = connectionString ?? "";
    if (connStr) {
      // Replace existing sslmode parameter or append if not present
      if (connStr.includes("sslmode=")) {
        connStr = connStr.replace(/sslmode=[^&]+/, "sslmode=verify-full");
      } else {
        connStr += connStr.includes("?") ? "&sslmode=verify-full" : "?sslmode=verify-full";
      }
    }
    
    _pool = new Pool({
      connectionString: connStr,
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
