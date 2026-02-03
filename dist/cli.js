#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const index_1 = require("./index");
const migrate_1 = require("./core/migrate");
require("dotenv/config");
const program = new commander_1.Command();
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
    const db = new index_1.GirdDB(new index_1.PostgresAdapter(process.env.DATABASE_URL));
    // We assume the schema is in 'src/schema' relative to where the command is run
    const migrator = new migrate_1.Migrator(db, "./src/schema");
    await migrator.sync();
    await db.close();
});
program.parse(process.argv);
