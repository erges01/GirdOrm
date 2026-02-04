#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import figlet from 'figlet';
import "dotenv/config";

// Import your actual core logic
import { GirdDB, PostgresAdapter } from "./index"; 
import { Migrator } from "./core/migrate";

const program = new Command();

// --- THE FANCY HEADER ---
console.log(
  chalk.cyan(
    figlet.textSync('GirdORM', { horizontalLayout: 'full' })
  )
);

program
  .name('gird')
  .description('🚀 The Code-First, Type-Safe ORM for Postgres')
  .version('1.0.17');

// --- 1. INIT COMMAND ---
program
  .command('init')
  .description('Initialize GirdORM in your project')
  .action(() => {
    console.log(chalk.blue('⚡ Initializing GirdORM project...'));

    const rootDir = process.cwd();
    const configPath = path.join(rootDir, 'gird.json');
    const schemaDir = path.join(rootDir, 'src', 'schema'); 

    // A. Create gird.json
    if (!fs.existsSync(configPath)) {
      const defaultConfig = {
        type: "postgres",
        url: "process.env.DATABASE_URL",
        synchronize: true,
        entities: ["src/schema/*.ts"]
      };
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
      console.log(chalk.green('   ✅ Created gird.json'));
    }

    // B. Create Schema Directory
    if (!fs.existsSync(schemaDir)) {
      fs.mkdirSync(schemaDir, { recursive: true });
      console.log(chalk.green('   ✅ Created src/schema/ directory'));
    }

    // C. Create .env if missing
    const envPath = path.join(rootDir, '.env');
    if (!fs.existsSync(envPath)) {
      fs.writeFileSync(envPath, 'DATABASE_URL="postgresql://postgres:password@localhost:5432/dbname"');
      console.log(chalk.green('   ✅ Created .env file'));
    }

    console.log(chalk.bold.cyan('\n🎉 Setup complete!'));
    console.log(chalk.gray('   1. Check your .env file.'));
    console.log(chalk.gray('   2. Run "npx gird make:model User" to start coding.'));
  });

// --- 2. MAKE:MODEL COMMAND ---
program
  .command('make:model <name>')
  .description('Generate a new model file')
  .action((name) => {
    // Capitalize Class Name (user -> User)
    const className = name.charAt(0).toUpperCase() + name.slice(1);
    // Lowercase Table Name (User -> users) + 's' for plural
    const tableName = name.toLowerCase() + "s";
    
    const fileName = `${className}.ts`;
    const filePath = path.join(process.cwd(), 'src', 'schema', fileName);

    if (fs.existsSync(filePath)) {
      console.error(chalk.red(`❌ Model ${fileName} already exists!`));
      process.exit(1);
    }

    // 👇 FIXED TEMPLATE: Adds 'static tableName' automatically
    const template = `import { Model, Column } from 'girdorm';

export class ${className} extends Model {
  static tableName = "${tableName}";

  @Column({ type: 'int', primary: true, generated: true })
  id!: number;

  @Column({ type: 'text' })
  name!: string;
}
`;
    // Create dir if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(filePath, template);
    console.log(chalk.green(`✅ Created model: src/schema/${fileName}`));
  });

// --- 3. MIGRATE COMMAND (UPDATED) ---
program
  .command('migrate')
  .description('Run database migrations')
  .action(async () => {
    // 👇 FIX: We removed the logic that crashes. 
    // Now we just tell the user that the App handles it.
    console.log(chalk.yellow("⚠️  NOTE: GirdORM now runs migrations automatically!"));
    console.log(chalk.gray("   Simply run your app: 'npx tsx src/main.ts'"));
    console.log(chalk.gray("   The 'db.init()' function will sync your registered models."));
  });

program.parse(process.argv);