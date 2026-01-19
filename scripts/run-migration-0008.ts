import { readFileSync } from "fs";
import { resolve } from "path";

import { Pool } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function runMigration() {
  try {
    const migrationSQL = readFileSync(
      resolve(process.cwd(), "drizzle/0008_add_telegram_id_and_email.sql"),
      "utf-8"
    );

    const statements = migrationSQL
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.error("Running migration 0008_add_telegram_id_and_email...");

    for (const statement of statements) {
      if (statement.trim()) {
        console.error(`Executing: ${statement.substring(0, 50)}...`);
        await pool.query(statement);
      }
    }

    console.error("✓ Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
