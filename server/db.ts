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
    // Use libpq compatibility mode with sslmode=require to suppress the SSL warning
    let connStr = connectionString ?? "";
    if (connStr) {
      // Remove any existing sslmode and uselibpqcompat params
      connStr = connStr.replace(/[?&]sslmode=[^&]+/g, "").replace(/[?&]uselibpqcompat=[^&]+/g, "");
      // Clean up any double && or trailing ?
      connStr = connStr.replace(/\?&/, "?").replace(/&&/g, "&").replace(/[?&]$/, "");
      // Add libpq compatibility mode
      connStr += connStr.includes("?") ? "&uselibpqcompat=true&sslmode=require" : "?uselibpqcompat=true&sslmode=require";
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
