"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
require("reflect-metadata");
const builder_1 = require("./builder");
const errors_1 = require("./errors");
// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------
/**
 * Applies all FindOptions (with, orderBy, limit, offset) onto a QueryBuilder.
 */
function applyOptions(q, options) {
    if (options.with) {
        // Support both a single string and an array of relation names
        const relations = Array.isArray(options.with)
            ? options.with
            : [options.with];
        for (const rel of relations) {
            q.with(rel);
        }
    }
    if (options.orderBy) {
        if (typeof options.orderBy === "string") {
            q.orderBy(options.orderBy);
        }
        else {
            q.orderBy(options.orderBy.column, options.orderBy.direction ?? "ASC");
        }
    }
    if (options.limit !== undefined)
        q.limit(options.limit);
    if (options.offset !== undefined)
        q.offset(options.offset);
}
/**
 * Wraps a plain DB-result object in a proper Model subclass instance.
 * This makes instance methods (like .save()) work on query results.
 */
function toInstance(ctor, raw) {
    return Object.assign(new ctor(), raw);
}
// ---------------------------------------------------------------------------
// Model base class
// ---------------------------------------------------------------------------
class Model {
    // -------------------------------------------------------------------------
    // 1. CREATE
    // -------------------------------------------------------------------------
    static async create(data) {
        const model = this;
        if (!model.adapter)
            throw new errors_1.GirdNoAdapterError(model.name);
        const q = new builder_1.QueryBuilder(model, model.adapter).insert(data);
        const { sql, params } = q.toSQL();
        try {
            const res = await model.adapter.query(sql, params);
            return toInstance(this, res[0]);
        }
        catch (err) {
            throw (0, errors_1.wrapPostgresError)(err);
        }
    }
    // -------------------------------------------------------------------------
    // 2. GET (single row by primary key)
    // -------------------------------------------------------------------------
    static async get(id, options = {}) {
        const model = this;
        if (!model.adapter)
            throw new errors_1.GirdNoAdapterError(model.name);
        const q = new builder_1.QueryBuilder(model, model.adapter).select("*").where({ id });
        applyOptions(q, options);
        const { sql, params } = q.toSQL();
        try {
            const res = await model.adapter.query(sql, params);
            return res[0] ? toInstance(this, res[0]) : null;
        }
        catch (err) {
            throw (0, errors_1.wrapPostgresError)(err);
        }
    }
    // -------------------------------------------------------------------------
    // 3. FIND (multiple rows by conditions)
    // -------------------------------------------------------------------------
    static async find(conditions = {}, options = {}) {
        const model = this;
        if (!model.adapter)
            throw new errors_1.GirdNoAdapterError(model.name);
        const q = new builder_1.QueryBuilder(model, model.adapter)
            .select("*")
            .where(conditions);
        applyOptions(q, options);
        const { sql, params } = q.toSQL();
        try {
            const rows = await model.adapter.query(sql, params);
            return rows.map((row) => toInstance(this, row));
        }
        catch (err) {
            throw (0, errors_1.wrapPostgresError)(err);
        }
    }
    // -------------------------------------------------------------------------
    // 4. ALL (shorthand for find with no conditions)
    // -------------------------------------------------------------------------
    static async all(options = {}) {
        return this.find({}, options);
    }
    // -------------------------------------------------------------------------
    // 5. UPDATE (static — updates by id, returns updated row)
    // -------------------------------------------------------------------------
    static async update(id, data) {
        const model = this;
        if (!model.adapter)
            throw new errors_1.GirdNoAdapterError(model.name);
        const q = new builder_1.QueryBuilder(model, model.adapter)
            .update(data)
            .where({ id });
        const { sql, params } = q.toSQL();
        try {
            const res = await model.adapter.query(sql, params);
            return res[0] ? toInstance(this, res[0]) : null;
        }
        catch (err) {
            throw (0, errors_1.wrapPostgresError)(err);
        }
    }
    // -------------------------------------------------------------------------
    // 6. DELETE
    // -------------------------------------------------------------------------
    static async delete(id) {
        const model = this;
        if (!model.adapter)
            throw new errors_1.GirdNoAdapterError(model.name);
        const q = new builder_1.QueryBuilder(model, model.adapter).delete().where({ id });
        const { sql, params } = q.toSQL();
        try {
            await model.adapter.query(sql, params);
        }
        catch (err) {
            throw (0, errors_1.wrapPostgresError)(err);
        }
    }
    // -------------------------------------------------------------------------
    // 7. INSTANCE METHOD: save()
    //
    // Works on any Model instance — whether constructed manually or returned
    // from create() / find() / get() (those now return real instances via
    // toInstance(), so .save() is always available and functional).
    //
    // Rules:
    //   - If the instance has a primary key value  → UPDATE
    //   - If the instance has NO primary key value → throw (use Model.create())
    // -------------------------------------------------------------------------
    async save() {
        const model = this.constructor;
        if (!model.adapter)
            throw new errors_1.GirdNoAdapterError(model.name ?? "Model");
        // Read column metadata set by @Column decorators
        const columns = Reflect.getMetadata("gird:columns", model) ?? [];
        if (columns.length === 0) {
            throw new errors_1.GirdSaveError(`No @Column definitions found on "${model.name}". ` +
                "Make sure you added @Column decorators and imported reflect-metadata.");
        }
        // Locate the primary key column
        const pkCol = columns.find((c) => c.options.primary);
        if (!pkCol) {
            throw new errors_1.GirdMissingPrimaryKeyError(model.name ?? "Model");
        }
        const pkValue = this[pkCol.name];
        if (pkValue === undefined || pkValue === null) {
            throw new errors_1.GirdSaveError("Instance has no primary key value. " +
                "Use Model.create() to insert new records.");
        }
        // Collect current values for all non-pk, non-generated columns
        const data = {};
        for (const col of columns) {
            // Never try to SET the primary key or an auto-generated column
            if (col.options.primary || col.options.generated)
                continue;
            const val = this[col.name];
            if (val !== undefined) {
                data[col.name] = val;
            }
        }
        if (Object.keys(data).length === 0) {
            // Nothing changed — no-op
            return this;
        }
        const q = new builder_1.QueryBuilder(model, model.adapter)
            .update(data)
            .where({ [pkCol.name]: pkValue });
        const { sql, params } = q.toSQL();
        try {
            const res = await model.adapter.query(sql, params);
            // Sync any server-side defaults / timestamps back onto this instance
            if (res[0]) {
                Object.assign(this, res[0]);
            }
        }
        catch (err) {
            throw (0, errors_1.wrapPostgresError)(err);
        }
        return this;
    }
}
exports.Model = Model;
