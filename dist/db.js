"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GirdDB = void 0;
const model_1 = require("./core/model");
const migrate_1 = require("./core/migrate");
const postgres_1 = require("./drivers/postgres");
class GirdDB {
    constructor(adapter) {
        this.adapter = adapter;
    }
    // 1. Init: Run Migrations automatically if using Postgres
    async init() {
        if (this.adapter instanceof postgres_1.PostgresAdapter) {
            const migrator = new migrate_1.Migrator(this, "./src/schema");
            await migrator.sync();
        }
    }
    // 2. Define a Model
    table(schema) {
        return new model_1.Model(this.adapter, schema);
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
        await this.adapter.close();
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
            // Create a 'Clone' of GirdDB using the locked client
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
