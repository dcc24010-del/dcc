import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "[DB] FATAL: DATABASE_URL is not set. Please add it to your Vercel environment variables (Settings → Environment Variables)."
  );
}

export const pool = new Pool({
  connectionString: connectionString!,
  ssl: connectionString?.includes("supabase") ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
