import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Pooled Neon string. Loaded from .env locally / hosting env in prod.
    url: process.env.DATABASE_URL!,
  },
});
