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
      resolve(process.cwd(), "drizzle/0006_lovely_pandemic.sql"),
      "utf-8"
    );

    const statements = migrationSQL
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.error("Running migration 0006_lovely_pandemic...");

    for (const statement of statements) {
      if (statement.trim()) {
        console.error(`Executing: ${statement.substring(0, 50)}...`);
        try {
          await pool.query(statement);
        } catch (error: unknown) {
          if (
            error instanceof Error &&
            (error.message.includes("already exists") ||
              error.message.includes("duplicate"))
          ) {
            console.error(
              `⚠ Skipping (already exists): ${statement.substring(0, 50)}...`
            );
            continue;
          }
          throw error;
        }
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
