#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const figlet_1 = __importDefault(require("figlet"));
require("dotenv/config");
const program = new commander_1.Command();
// --- THE FANCY HEADER ---
console.log(chalk_1.default.cyan(figlet_1.default.textSync('GirdORM', { horizontalLayout: 'full' })));
program
    .name('gird')
    .description('🚀 The Code-First, Type-Safe ORM for Postgres')
    .version('1.0.17');
// --- 1. INIT COMMAND ---
program
    .command('init')
    .description('Initialize GirdORM in your project')
    .action(() => {
    console.log(chalk_1.default.blue('⚡ Initializing GirdORM project...'));
    const rootDir = process.cwd();
    const configPath = path_1.default.join(rootDir, 'gird.json');
    const schemaDir = path_1.default.join(rootDir, 'src', 'schema');
    // A. Create gird.json
    if (!fs_1.default.existsSync(configPath)) {
        const defaultConfig = {
            type: "postgres",
            url: "process.env.DATABASE_URL",
            synchronize: true,
            entities: ["src/schema/*.ts"]
        };
        fs_1.default.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        console.log(chalk_1.default.green('   ✅ Created gird.json'));
    }
    // B. Create Schema Directory
    if (!fs_1.default.existsSync(schemaDir)) {
        fs_1.default.mkdirSync(schemaDir, { recursive: true });
        console.log(chalk_1.default.green('   ✅ Created src/schema/ directory'));
    }
    // C. Create .env if missing
    const envPath = path_1.default.join(rootDir, '.env');
    if (!fs_1.default.existsSync(envPath)) {
        fs_1.default.writeFileSync(envPath, 'DATABASE_URL="postgresql://postgres:password@localhost:5432/dbname"');
        console.log(chalk_1.default.green('   ✅ Created .env file'));
    }
    console.log(chalk_1.default.bold.cyan('\n🎉 Setup complete!'));
    console.log(chalk_1.default.gray('   1. Check your .env file.'));
    console.log(chalk_1.default.gray('   2. Run "npx gird make:model User" to start coding.'));
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
    const filePath = path_1.default.join(process.cwd(), 'src', 'schema', fileName);
    if (fs_1.default.existsSync(filePath)) {
        console.error(chalk_1.default.red(`❌ Model ${fileName} already exists!`));
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
    const dir = path_1.default.dirname(filePath);
    if (!fs_1.default.existsSync(dir))
        fs_1.default.mkdirSync(dir, { recursive: true });
    fs_1.default.writeFileSync(filePath, template);
    console.log(chalk_1.default.green(`✅ Created model: src/schema/${fileName}`));
});
// --- 3. MIGRATE COMMAND (UPDATED) ---
program
    .command('migrate')
    .description('Run database migrations')
    .action(async () => {
    // 👇 FIX: We removed the logic that crashes. 
    // Now we just tell the user that the App handles it.
    console.log(chalk_1.default.yellow("⚠️  NOTE: GirdORM now runs migrations automatically!"));
    console.log(chalk_1.default.gray("   Simply run your app: 'npx tsx src/main.ts'"));
    console.log(chalk_1.default.gray("   The 'db.init()' function will sync your registered models."));
});
program.parse(process.argv);
