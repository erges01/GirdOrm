"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionAdapter = exports.PostgresAdapter = void 0;
const pg_1 = require("pg");
// 1. Main Adapter (Manages the Pool)
class PostgresAdapter {
    constructor(connectionString) {
        this.pool = new pg_1.Pool({
            connectionString,
            // Fix: Only use SSL in production (Neon/AWS), otherwise localhost crashes
            ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
        });
    }
    // Used by Model to run standard queries
    async query(sql, params = []) {
        const res = await this.pool.query(sql, params);
        return res.rows;
    }
    // ✅ Added queryRaw (Required by Migrator)
    async queryRaw(sql, params = []) {
        const res = await this.pool.query(sql, params);
        return res.rows;
    }
    // Used by reset.ts to kill the connection
    async close() {
        await this.pool.end();
    }
    // Used by GirdDB.transaction() to get a locked connection
    async getClient() {
        return this.pool.connect();
    }
    getPlaceholder(index) {
        return `$${index + 1}`; // Converts 0-index to Postgres $1, $2...
    }
}
exports.PostgresAdapter = PostgresAdapter;
// 2. Transaction Adapter (Locks to ONE Client)
class TransactionAdapter {
    constructor(client) {
        this.client = client;
    }
    async query(sql, params = []) {
        const res = await this.client.query(sql, params);
        return res.rows;
    }
    // ✅ Added queryRaw (Required by Interface)
    async queryRaw(sql, params = []) {
        const res = await this.client.query(sql, params);
        return res.rows;
    }
    getPlaceholder(index) {
        return `$${index + 1}`;
    }
    // No-op: We don't close the pool inside a transaction
    async close() { }
}
exports.TransactionAdapter = TransactionAdapter;
