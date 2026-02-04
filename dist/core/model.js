"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
const builder_1 = require("./builder");
class Model {
    // --- 1. CREATE ---
    static async create(data) {
        const model = this;
        // 👇 FIX: Pass 'model' directly so Builder can read @HasMany metadata
        const q = new builder_1.QueryBuilder(model, model.adapter)
            .insert(data);
        const { sql, params } = q.toSQL();
        const res = await model.adapter.query(sql, params);
        return res[0];
    }
    // --- 2. READ (Single) ---
    static async get(id, options = {}) {
        const model = this;
        // 👇 FIX
        const q = new builder_1.QueryBuilder(model, model.adapter)
            .select("*")
            .where({ id });
        if (options.with)
            q.with(options.with);
        const { sql, params } = q.toSQL();
        const res = await model.adapter.query(sql, params);
        return res[0] || null;
    }
    // --- 3. READ (Many) ---
    static async find(conditions = {}, options = {}) {
        const model = this;
        // 👇 FIX
        const q = new builder_1.QueryBuilder(model, model.adapter)
            .select("*")
            .where(conditions);
        if (options.with)
            q.with(options.with);
        const { sql, params } = q.toSQL();
        return await model.adapter.query(sql, params);
    }
    // --- 4. READ (All) ---
    static async all() {
        return this.find({});
    }
    // --- 5. UPDATE ---
    static async update(id, data) {
        const model = this;
        // 👇 FIX
        const q = new builder_1.QueryBuilder(model, model.adapter)
            .update(data)
            .where({ id });
        const { sql, params } = q.toSQL();
        return await model.adapter.query(sql, params);
    }
    // --- 6. DELETE ---
    static async delete(id) {
        const model = this;
        // 👇 FIX
        const q = new builder_1.QueryBuilder(model, model.adapter)
            .delete()
            .where({ id });
        const { sql, params } = q.toSQL();
        return await model.adapter.query(sql, params);
    }
    // --- INSTANCE METHODS ---
    async save() {
        return this;
    }
}
exports.Model = Model;
