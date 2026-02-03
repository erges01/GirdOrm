"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLiteAdapter = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
class SQLiteAdapter {
    constructor(filename) {
        this.db = new better_sqlite3_1.default(filename);
        this.db.pragma("foreign_keys = ON");
    }
    async connect() {
        // SQLite connects instantly when the file is opened
        // console.log("✅ Connected to SQLite");
    }
    async query(sql, params) {
        // FIX: SQLite crashes on Booleans, so we convert true/false -> 1/0
        const safeParams = params.map(p => {
            if (typeof p === 'boolean')
                return p ? 1 : 0;
            return p;
        });
        const stmt = this.db.prepare(sql);
        // If it is a SELECT, use .all(), otherwise use .run()
        if (sql.trim().toUpperCase().startsWith("SELECT")) {
            const rows = stmt.all(...safeParams);
            return { rows };
        }
        else {
            const res = stmt.run(...safeParams);
            // SQLite returns 'changes' to tell us how many rows were affected
            return { rows: [], affectedRows: res.changes };
        }
    }
    async disconnect() {
        this.db.close();
    }
    // SQLite uses "?" for placeholders
    getPlaceholder(index) {
        return "?";
    }
}
exports.SQLiteAdapter = SQLiteAdapter;
