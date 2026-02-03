#!/usr/bin/env node
import { Command } from "commander";
import { GirdDB, PostgresAdapter } from "./index";
import { Migrator } from "./core/migrate";
import "dotenv/config";

const program = new Command();

program
  .name("gird")
  .description("GirdORM CLI Tool")
  .version("1.0.0");

program
  .command("migrate")
  .description("Run database migrations")
  .action(async () => {
    if (!process.env.DATABASE_URL) {
      console.error("❌ Error: DATABASE_URL is missing in .env");
      process.exit(1);
    }

    console.log("🔌 Connecting to CLI Database...");
    const db = new GirdDB(new PostgresAdapter(process.env.DATABASE_URL));
    
    // We assume the schema is in 'src/schema' relative to where the command is run
    const migrator = new Migrator(db, "./src/schema");
    
    await migrator.sync();
    await db.close();
  });

program.parse(process.argv);