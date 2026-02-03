"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLAdapter = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
class MySQLAdapter {
    constructor(uri) {
        this.uri = uri;
        this.connection = null;
    }
    async connect() {
        this.connection = await promise_1.default.createConnection(this.uri);
        // console.log("✅ Connected to MySQL");
    }
    async query(sql, params) {
        if (!this.connection)
            throw new Error("Not connected to MySQL");
        // MySQL uses ? just like SQLite, so it's easy!
        const [rows, fields] = await this.connection.execute(sql, params);
        // MySQL returns metadata differently for SELECT vs INSERT
        if (Array.isArray(rows)) {
            return { rows };
        }
        else {
            return { rows: [], affectedRows: rows.affectedRows };
        }
    }
    async disconnect() {
        if (this.connection)
            await this.connection.end();
    }
    // MySQL uses "?"
    getPlaceholder(index) {
        return "?";
    }
}
exports.MySQLAdapter = MySQLAdapter;
