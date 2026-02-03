"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
const builder_1 = require("./builder");
class Model {
    constructor(adapter, table) {
        this.adapter = adapter;
        this.table = table;
    }
    // 1. CREATE
    async create(data) {
        const q = new builder_1.QueryBuilder(this.table, this.adapter).insert(data);
        const { sql, params } = q.toSQL();
        const res = await this.adapter.query(sql, params);
        // FIX: Add '!' to assert it's defined (Create always returns data in Postgres)
        return res[0];
    }
    // 2. READ (Single)
    async get(id, options = {}) {
        const q = new builder_1.QueryBuilder(this.table, this.adapter)
            .select("*")
            .where({ id });
        if (options.with) {
            q.with(options.with);
        }
        const { sql, params } = q.toSQL();
        const res = await this.adapter.query(sql, params);
        return res[0] || null;
    }
    // 3. READ (Many)
    async find(conditions, options = {}) {
        const q = new builder_1.QueryBuilder(this.table, this.adapter)
            .select("*")
            .where(conditions);
        if (options.with) {
            q.with(options.with);
        }
        const { sql, params } = q.toSQL();
        return await this.adapter.query(sql, params);
    }
    // 4. READ (All)
    async all() {
        return this.find({});
    }
    // 5. UPDATE
    async update(id, data) {
        const q = new builder_1.QueryBuilder(this.table, this.adapter)
            .update(data)
            .where({ id });
        const { sql, params } = q.toSQL();
        return await this.adapter.query(sql, params);
    }
    // 6. DELETE
    async delete(id) {
        const q = new builder_1.QueryBuilder(this.table, this.adapter)
            .delete()
            .where({ id });
        const { sql, params } = q.toSQL();
        return await this.adapter.query(sql, params);
    }
}
exports.Model = Model;
