#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import fs from "fs";
import path from "path";
import { GirdDB } from "../src/db";
import { PostgresAdapter } from "../src/drivers/postgres";
import figlet from "figlet";
import chalk from "chalk";

const program = new Command();

// --- HELPER: The Drip Banner 💧 ---
const printBanner = () => {
  console.clear();
  console.log(
    chalk.cyan(
      figlet.textSync("GirdORM", {
        horizontalLayout: "full",
        font: "Slant",
      })
    )
  );
  console.log(chalk.dim(" better than prisma!.\n"));
};

program
  .name("gird")
  .description("⚡ The GirdORM CLI")
  .version("1.0.0");

// 1. INIT Command
program
  .command("init")
  .description("Initialize GirdORM in this project")
  .action(() => {
    printBanner();
    console.log(chalk.blue("📦 Initializing Project..."));

    const cwd = process.cwd();
    const schemaDir = path.join(cwd, "src", "schema");

    if (!fs.existsSync(schemaDir)) {
      console.log(chalk.yellow("  📂 Creating src/schema folder..."));
      fs.mkdirSync(schemaDir, { recursive: true });
      
      const samplePath = path.join(schemaDir, "example.ts");
      const sampleContent = `import { table, int, text } from "../../core/table";\n\nexport const ExampleTable = table("examples", {\n  id: int().primaryKey(),\n  name: text()\n});`;
      fs.writeFileSync(samplePath, sampleContent);
      console.log(chalk.green("  ✅ Created sample: src/schema/example.ts"));
    } else {
      console.log(chalk.dim("  ℹ️  src/schema already exists. Skipping."));
    }
    
    const envPath = path.join(cwd, ".env");
    if (!fs.existsSync(envPath)) {
        console.log(chalk.yellow("  📝 Creating default .env file..."));
        fs.writeFileSync(envPath, 'DATABASE_URL="postgresql://user:pass@localhost:5432/db"');
    }

    console.log(chalk.bold.green("\n✅ GirdORM Initialized!"));
    console.log(chalk.white("👉 Run ") + chalk.cyan("gird migrate") + chalk.white(" to start cooking."));
  });

// 2. MIGRATE Command
program
  .command("migrate")
  .description("Sync the database with schema files")
  .action(async () => {
    printBanner();
    try {
        const connectionString = process.env.DATABASE_URL;
        if (!connectionString) {
            console.error(chalk.bold.red("❌ Error: DATABASE_URL is missing from .env file."));
            process.exit(1);
        }
        
        console.log(chalk.blue("🔌 Connecting to Postgres..."));
        
        const adapter = new PostgresAdapter(connectionString);
        const db = new GirdDB(adapter);

        // The internal migrator logs its own stuff, but we wrap it visually
        console.log(chalk.yellow("🔄 Checking Schema Drift..."));
        await db.init();

        await db.close();
        console.log(chalk.bold.green("\n✅ Database Sync Complete."));
        
    } catch (e: any) {
        console.error(chalk.bold.red("\n❌ Migration Failed:"));
        console.error(chalk.red(e.message));
        process.exit(1);
    }
  });

// 3. GENERATE Command (Maximum Flex)
program
  .command("generate")
  .description("Generate TypeScript types")
  .action(() => {
    printBanner();
    console.log(chalk.yellow("🤔 Analyzing Schema..."));
    
    setTimeout(() => {
        console.log(chalk.magenta("\n✨ Just kidding!"));
        console.log(chalk.white("🔥 GirdORM uses ") + chalk.bold.cyan("100% TypeScript Inference."));
        console.log(chalk.gray("   No generation step required.")); 
        console.log(chalk.green("   You are already type-safe. That's the power of GirdORM."));
    }, 800);
  });

program.parse(process.argv);