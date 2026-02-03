"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migrator = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url"); // Required for Windows import paths
class Migrator {
    constructor(db, schemaDir) {
        this.db = db;
        this.schemaDir = schemaDir;
    }
    async sync() {
        console.log("🔄 Syncing Database...");
        // 1. Get absolute path to schema folder (Fixes Windows/Path issues)
        const absoluteSchemaPath = path_1.default.resolve(process.cwd(), this.schemaDir);
        if (!fs_1.default.existsSync(absoluteSchemaPath)) {
            throw new Error(`Schema folder not found at: ${absoluteSchemaPath}`);
        }
        // 2. Load ALL tables into memory first
        const tables = [];
        const files = fs_1.default.readdirSync(absoluteSchemaPath).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));
        for (const file of files) {
            const filePath = path_1.default.join(absoluteSchemaPath, file);
            // FIX: Use pathToFileURL for Windows compatibility
            const fileUrl = (0, url_1.pathToFileURL)(filePath).href;
            const module = await Promise.resolve(`${fileUrl}`).then(s => __importStar(require(s)));
            // ✅ FIX: "Duck Typing" Check
            // Instead of 'instanceof Table', we check if it LOOKS like a table.
            // This fixes the bug where npm link/install causes two different Table classes.
            const tableDef = Object.values(module).find((exp) => exp && exp.tableName && exp.columns);
            if (tableDef) {
                tables.push(tableDef);
            }
        }
        // 3. The Retry Loop (Topological Sort Strategy)
        let pending = [...tables];
        let attempts = 0;
        const maxAttempts = pending.length * 2;
        while (pending.length > 0) {
            attempts++;
            const nextPending = [];
            let progressMade = false;
            console.log(`\n--- Migration Pass ${attempts} ---`);
            for (const table of pending) {
                try {
                    await this.syncTable(table);
                    progressMade = true;
                }
                catch (e) {
                    // Check for "relation does not exist" error (Code 42P01)
                    if (e.code === '42P01' || e.message.includes("does not exist")) {
                        console.log(`   ⏳ Postponing ${table.tableName} (waiting for dependencies...)`);
                        nextPending.push(table);
                    }
                    else {
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
    async syncTable(table) {
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
        }
        else {
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
            const existingColNames = existingCols.map((c) => c.column_name.toLowerCase());
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
exports.Migrator = Migrator;
