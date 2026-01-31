#!/usr/bin/env node
import "dotenv/config"; // Load .env file
import { Command } from "commander";
import fs from "fs";
import path from "path";
import { GirdDB } from "../src/db";
import { Migrator } from "../src/core/migrate";
import { PostgresAdapter } from "../src/drivers/postgres";

const program = new Command();

program
  .name("gird")
  .description("GirdORM CLI Tool");

// 1. INIT Command
program
  .command("init")
  .description("Initialize GirdORM in this project")
  .action(() => {
    const cwd = process.cwd();
    const schemaDir = path.join(cwd, "src", "schema");

    if (!fs.existsSync(schemaDir)) {
      console.log("📂 Creating src/schema folder...");
      fs.mkdirSync(schemaDir, { recursive: true });
    }
    
    // Create a .env example if it doesn't exist
    const envPath = path.join(cwd, ".env");
    if (!fs.existsSync(envPath)) {
        console.log("📝 Creating default .env file...");
        fs.writeFileSync(envPath, 'DATABASE_URL="postgresql://user:pass@localhost:5432/db"');
    }

    console.log("✅ GirdORM Initialized!");
  });

// 2. MIGRATE Command
program
  .command("migrate")
  .description("Sync the database with schema files")
  .action(async () => {
    try {
        const cwd = process.cwd();
        
        // 🔒 SECURE: Read from Environment Variable
        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            console.error("❌ Error: DATABASE_URL is missing from .env file.");
            process.exit(1);
        }
        
        console.log(`🔌 Connecting to Postgres...`);
        
        const adapter = new PostgresAdapter(connectionString);
        
        const db = new GirdDB(adapter);
        await db.init();

        const schemaDir = path.join(cwd, "src/schema");
        const migrator = new Migrator(db, schemaDir);
        await migrator.sync();

        await db.close();
    } catch (e) {
        console.error("❌ Migration Failed:", e);
        process.exit(1);
    }
  });

program.parse(process.argv);