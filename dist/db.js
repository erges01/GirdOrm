"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GirdDB = void 0;
const migrate_1 = require("./core/migrate");
const postgres_1 = require("./drivers/postgres");
class GirdDB {
    constructor(adapter) {
        // 👇 NEW: We store the models here so Migrator can find them
        this.models = [];
        this.adapter = adapter;
    }
    // 1. Init: Run Migrations using the REGISTERED models (not file scanning)
    async init() {
        if (this.adapter instanceof postgres_1.PostgresAdapter) {
            // 👇 CHANGED: Pass 'this' instead of a file path
            const migrator = new migrate_1.Migrator(this);
            await migrator.sync();
        }
    }
    // 2. Register Models
    register(models) {
        // 👇 NEW: Save them to memory
        this.models = models;
        for (const model of models) {
            model.adapter = this.adapter;
            if (!model.tableName) {
                model.tableName = model.name;
            }
        }
    }
    // Helper A: Run command (Insert/Create)
    async execute(sql, params = []) {
        return await this.adapter.query(sql, params);
    }
    // Helper B: Run query (Select)
    async queryRaw(sql, params = []) {
        return await this.adapter.query(sql, params);
    }
    // 3. Close Connection
    async close() {
        if (this.adapter.close) {
            await this.adapter.close();
        }
    }
    // --- 4. Transaction Support ---
    async transaction(callback) {
        if (!(this.adapter instanceof postgres_1.PostgresAdapter)) {
            throw new Error("Transactions are only supported on the main PostgresAdapter.");
        }
        console.log("🔒 Starting Transaction...");
        const client = await this.adapter.getClient();
        try {
            await client.query("BEGIN");
            const txAdapter = new postgres_1.TransactionAdapter(client);
            const txDB = new GirdDB(txAdapter);
            await callback(txDB);
            await client.query("COMMIT");
            console.log("🔓 Transaction Committed.");
        }
        catch (e) {
            await client.query("ROLLBACK");
            console.error("🛑 Transaction Failed! Rolling back changes.");
            throw e;
        }
        finally {
            client.release();
        }
    }
}
exports.GirdDB = GirdDB;
