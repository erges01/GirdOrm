"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBuilder = void 0;
class QueryBuilder {
    constructor(table, adapter) {
        this._columns = [];
        this._conditions = [];
        this._params = [];
        this._joins = [];
        this._groupBy = []; // <-- NEW: Needed for JSON_AGG
        this._operation = "SELECT";
        this._data = {};
        this._table = table;
        this._adapter = adapter;
    }
    select(...columns) {
        this._operation = "SELECT";
        if (columns.length > 0 && columns[0] !== "*") {
            this._columns = columns;
        }
        else {
            this._columns = [`"${this._table.tableName}".*`];
        }
        return this;
    }
    // --- THE MISSING METHOD: Handles Relations ---
    with(relationName) {
        const rel = this._table.relations[relationName];
        if (!rel)
            throw new Error(`Relation ${relationName} not found on ${this._table.tableName}`);
        if (rel.type === "belongsTo") {
            // Standard Left Join (Post -> User)
            this._joins.push(`LEFT JOIN "${rel.table}" ON "${this._table.tableName}"."${rel.localKey}" = "${rel.table}"."${rel.foreignKey}"`);
            // Select the related data as a JSON object
            this._columns.push(`to_json("${rel.table}".*) as "${relationName}"`);
        }
        else if (rel.type === "hasMany") {
            // Advanced JSON_AGG (User -> Posts)
            this._joins.push(`LEFT JOIN "${rel.table}" ON "${this._table.tableName}"."${rel.localKey}" = "${rel.table}"."${rel.foreignKey}"`);
            this._columns.push(`COALESCE(json_agg("${rel.table}".*) FILTER (WHERE "${rel.table}".id IS NOT NULL), '[]') as "${relationName}"`);
            // We MUST group by the main table's ID when aggregating
            this._groupBy.push(`"${this._table.tableName}".id`);
        }
        return this;
    }
    // --- Prisma-style filters ({ gt: 18 }) ---
    where(conditions) {
        Object.entries(conditions).forEach(([key, value]) => {
            // Use quotes for safety: "table"."column"
            const colName = key.includes(".") ? key : `"${this._table.tableName}"."${key}"`;
            // 1. Handle Operators: { age: { gt: 18 } }
            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                const ops = value;
                Object.entries(ops).forEach(([op, val]) => {
                    // We use a placeholder (??) to be replaced later by $1/$2
                    this._params.push(val);
                    if (op === "gt")
                        this._conditions.push(`${colName} > ??`);
                    else if (op === "lt")
                        this._conditions.push(`${colName} < ??`);
                    else if (op === "gte")
                        this._conditions.push(`${colName} >= ??`);
                    else if (op === "lte")
                        this._conditions.push(`${colName} <= ??`);
                    else if (op === "contains")
                        this._conditions.push(`${colName} LIKE ??`);
                });
            }
            // 2. Handle Simple Equality: { name: "Tunde" }
            else {
                this._conditions.push(`${colName} = ??`);
                this._params.push(value);
            }
        });
        return this;
    }
    insert(data) {
        this._operation = "INSERT";
        this._data = data;
        return this;
    }
    update(data) {
        this._operation = "UPDATE";
        this._data = data;
        return this;
    }
    delete() {
        this._operation = "DELETE";
        return this;
    }
    // --- SQL GENERATION ---
    toSQL() {
        let paramCounter = 0;
        // Helper: Generates $1, $2, $3...
        const nextParam = () => {
            paramCounter++;
            return this._adapter ? this._adapter.getPlaceholder(paramCounter - 1) : `$${paramCounter}`;
        };
        // 1. INSERT Logic
        if (this._operation === "INSERT") {
            const keys = Object.keys(this._data);
            const values = Object.values(this._data);
            const placeholders = keys.map(() => nextParam()).join(", ");
            const columns = keys.map(k => `"${k}"`).join(", ");
            return {
                sql: `INSERT INTO "${this._table.tableName}" (${columns}) VALUES (${placeholders}) RETURNING *;`,
                params: values,
            };
        }
        // 2. UPDATE Logic
        if (this._operation === "UPDATE") {
            const keys = Object.keys(this._data);
            const values = Object.values(this._data);
            const setClause = keys.map((k) => `"${k}" = ${nextParam()}`).join(", ");
            let sql = `UPDATE "${this._table.tableName}" SET ${setClause}`;
            if (this._conditions.length > 0) {
                const whereClause = this._conditions.map(c => c.replace("??", nextParam())).join(" AND ");
                sql += ` WHERE ${whereClause}`;
            }
            return { sql: sql + " RETURNING *;", params: [...values, ...this._params] };
        }
        // 3. DELETE Logic
        if (this._operation === "DELETE") {
            let sql = `DELETE FROM "${this._table.tableName}"`;
            if (this._conditions.length > 0) {
                const whereClause = this._conditions.map(c => c.replace("??", nextParam())).join(" AND ");
                sql += ` WHERE ${whereClause}`;
            }
            return { sql: sql + ";", params: this._params };
        }
        // 4. SELECT Logic
        const selection = this._columns.join(", ");
        let sql = `SELECT ${selection} FROM "${this._table.tableName}"`;
        if (this._joins.length > 0)
            sql += ` ${this._joins.join(" ")}`;
        if (this._conditions.length > 0) {
            const whereClause = this._conditions.map(c => c.replace("??", nextParam())).join(" AND ");
            sql += ` WHERE ${whereClause}`;
        }
        // 5. GROUP BY Logic (Crucial for hasMany)
        if (this._groupBy.length > 0) {
            sql += ` GROUP BY ${this._groupBy.join(", ")}`;
        }
        return { sql: sql + ";", params: this._params };
    }
}
exports.QueryBuilder = QueryBuilder;
