import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is missing. Copy .env.example to .env and set the pooled Neon string.",
  );
}

// Stateless HTTP driver — no interactive transactions.
// Batch independent writes with db.batch() where needed.
const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
