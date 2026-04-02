import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Log clearly but do NOT throw here — api/index.ts guards this before
  // any DB code runs. Throwing at module-load time breaks @vercel/node
  // static bundling (the function would crash on import, not in the handler).
  console.warn(
    "[DB] WARNING: DATABASE_URL is not set. " +
      "Add it in Vercel → Project Settings → Environment Variables."
  );
}

export const pool = new Pool({
  connectionString: connectionString ?? "",
  ssl: connectionString?.includes("supabase") ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 8000,
  idleTimeoutMillis: 30000,
  max: 5,
});

export const db = drizzle(pool, { schema });
