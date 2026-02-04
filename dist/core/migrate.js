"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migrator = void 0;
require("reflect-metadata");
class Migrator {
    // We only need the DB instance now
    constructor(db) {
        this.db = db;
    }
    async sync() {
        console.log("   🔄 Syncing Database...");
        // 👇 CRITICAL FIX: Use the models stored in GirdDB memory
        // This works perfectly with tsx because the classes are already loaded.
        const models = this.db.models;
        if (!models || models.length === 0) {
            console.log("   ⚠️ No models registered. Did you call db.register([Model])?");
            return;
        }
        for (const model of models) {
            // 1. Get Table Name
            const tableName = model.tableName;
            if (!tableName)
                continue;
            // 2. Get Columns from Metadata (The @Column decorators)
            const columns = Reflect.getMetadata("gird:columns", model) || [];
            if (columns.length === 0) {
                console.log(`   ⚠️ Skipping ${tableName}: No columns defined.`);
                continue;
            }
            // 3. Build the SQL
            const colDefs = columns.map((col) => {
                let def = `"${col.name}" ${col.options.type}`;
                if (col.options.primary)
                    def += " PRIMARY KEY";
                if (col.options.generated)
                    def += " GENERATED ALWAYS AS IDENTITY";
                if (!col.options.nullable && !col.options.generated)
                    def += " NOT NULL";
                return def;
            });
            const createSql = `CREATE TABLE IF NOT EXISTS "${tableName}" (${colDefs.join(", ")});`;
            // 4. Run the Query
            try {
                await this.db.adapter.query(createSql);
                console.log(`   ✅ Synced: ${tableName}`);
            }
            catch (err) {
                console.error(`   ❌ Failed to sync ${tableName}:`, err.message);
            }
        }
        console.log("✅ Database Sync Complete.");
    }
}
exports.Migrator = Migrator;
