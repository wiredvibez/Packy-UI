import { existsSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { config as loadEnv } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

if (existsSync(".env")) {
  loadEnv({ path: ".env" });
}
if (existsSync(".env.local")) {
  loadEnv({ path: ".env.local", override: true });
}

const strict = process.argv.includes("--strict");
const skip = process.env.SKIP_DB_MIGRATE === "1";
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (skip) {
  console.log("SKIP_DB_MIGRATE=1 — skipping database migrations.");
  process.exit(0);
}

if (!url) {
  if (strict) {
    console.error(
      "DATABASE_URL (or DATABASE_URL_UNPOOLED) is required to run migrations.",
    );
    process.exit(1);
  }
  console.log("DATABASE_URL is not set — skipping migrations.");
  process.exit(0);
}

async function main() {
  const sql = neon(url!);
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Migrations applied.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
