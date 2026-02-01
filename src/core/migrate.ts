import fs from "fs";
import path from "path";
import { GirdDB } from "../db"; 
import { Table } from "./table";
import { pathToFileURL } from "url"; // Required for Windows import paths

export class Migrator {
  private db: GirdDB;
  private schemaDir: string;

  constructor(db: GirdDB, schemaDir: string) {
    this.db = db;
    this.schemaDir = schemaDir;
  }

  async sync() {
    console.log("🔄 Syncing Database...");
    
    // 1. Get absolute path to schema folder (Fixes Windows/Path issues)
    const absoluteSchemaPath = path.resolve(process.cwd(), this.schemaDir);

    if (!fs.existsSync(absoluteSchemaPath)) {
      throw new Error(`Schema folder not found at: ${absoluteSchemaPath}`);
    }

    // 2. Load ALL tables into memory first
    const tables: Table[] = [];
    const files = fs.readdirSync(absoluteSchemaPath).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));
    
    for (const file of files) {
      const filePath = path.join(absoluteSchemaPath, file);
      // FIX: Use pathToFileURL for Windows compatibility
      const fileUrl = pathToFileURL(filePath).href;
      
      const module = await import(fileUrl);
      const tableDef = Object.values(module).find((exp) => exp instanceof Table) as Table;
      if (tableDef) tables.push(tableDef);
    }

    // 3. The Retry Loop (Topological Sort Strategy)
    let pending = [...tables];
    let attempts = 0;
    const maxAttempts = pending.length * 2; 

    while (pending.length > 0) {
        attempts++;
        const nextPending: Table[] = [];
        let progressMade = false;

        console.log(`\n--- Migration Pass ${attempts} ---`);

        for (const table of pending) {
            try {
                await this.syncTable(table);
                progressMade = true; 
            } catch (e: any) {
                // Check for "relation does not exist" error (Code 42P01)
                if (e.code === '42P01' || e.message.includes("does not exist")) {
                    console.log(`   ⏳ Postponing ${table.tableName} (waiting for dependencies...)`);
                    nextPending.push(table);
                } else {
                    throw e;
                }
            }
        }

        if (!progressMade && nextPending.length > 0) {
            console.error("❌ DEADLOCK DETECTED: These tables depend on each other or are missing a reference:");
            nextPending.forEach(t => console.error(`   - ${t.tableName}`));
            throw new Error("Migration stuck.");
        }

        if (attempts > maxAttempts) {
            throw new Error("Migration timed out.");
        }

        pending = nextPending;
    }

    console.log("\n✅ Database Sync Complete.");
  }

  private async syncTable(table: Table) {
    // 1. Check if table exists
    const checkSql = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = '${table.tableName}' 
      AND table_schema = 'public';
    `;
    
    const existingTables = await this.db.queryRaw(checkSql);

    if (existingTables.length === 0) {
      console.log(`   ✨ Creating table: ${table.tableName}`);
      await this.db.execute(table.toSQL());
    } else {
      console.log(`   ✅ Exists: ${table.tableName}`);
      
      // 2. Check for new columns
      const colCheckSql = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = '${table.tableName}' 
        AND table_schema = 'public';
      `;
      
      const existingCols = await this.db.queryRaw(colCheckSql);
      
      // FIX: Lowercase everything for comparison
      // Postgres returns 'authorid', your code says 'authorId'
      const existingColNames = existingCols.map((c: any) => c.column_name.toLowerCase());

      for (const [colName, colDef] of Object.entries(table.columns)) {
        // Compare schema column (lowercased) with DB columns
        if (!existingColNames.includes(colName.toLowerCase())) {
          console.log(`      ➕ Adding column: ${colName}`);
          
          // Use quotes around column name to preserve casing if needed
          const sql = `ALTER TABLE "${table.tableName}" ADD COLUMN "${colName}" ${colDef.type}`;
          await this.db.execute(sql);
        }
      }
    }
  }
}