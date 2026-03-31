"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBuilder = void 0;
const errors_1 = require("./errors");
require("reflect-metadata");
class QueryBuilder {
    constructor(model, adapter) {
        this._columns = [];
        this._conditions = [];
        this._params = [];
        this._joins = [];
        this._groupBy = [];
        this._orderBy = [];
        this._operation = "SELECT";
        this._data = {};
        this._model = model;
        this._tableName = model.tableName;
        this._adapter = adapter;
        // Default: select everything from the main table to avoid ambiguous column errors on joins
        this._columns = [`"${this._tableName}".*`];
    }
    // ---------------------------------------------------------------------------
    // SELECT
    // ---------------------------------------------------------------------------
    select(...columns) {
        this._operation = "SELECT";
        if (columns.length > 0 && columns[0] !== "*") {
            this._columns = columns;
        }
        return this;
    }
    // ---------------------------------------------------------------------------
    // WITH (eager-load relations) — accepts a single name OR an array of names
    // ---------------------------------------------------------------------------
    with(relationName) {
        const names = Array.isArray(relationName) ? relationName : [relationName];
        for (const name of names) {
            this._loadRelation(name);
        }
        return this;
    }
    _loadRelation(relationName) {
        // 1. Read @HasMany / @BelongsTo metadata stored by decorators
        const relations = Reflect.getMetadata("gird:relations", this._model) || [];
        // 2. Find the relation the caller asked for (e.g. "posts")
        const rel = relations.find((r) => r.key === relationName);
        if (!rel) {
            throw new errors_1.GirdRelationNotFoundError(relationName, this._tableName);
        }
        // 3. Resolve the related model class (lazy fn avoids circular-import issues)
        const RelatedModel = rel.model();
        const relatedTable = RelatedModel.tableName;
        if (rel.type === "belongsTo") {
            // e.g. Post belongsTo User  →  JOIN "users" ON "posts"."authorid" = "users"."id"
            this._joins.push(`LEFT JOIN "${relatedTable}" ON "${this._tableName}"."${rel.foreignKey}" = "${relatedTable}"."id"`);
            // Nest the related row as a JSON object
            this._columns.push(`to_json("${relatedTable}".*) AS "${relationName}"`);
        }
        else if (rel.type === "hasMany") {
            // e.g. User hasMany Posts  →  JOIN "posts" ON "users"."id" = "posts"."authorid"
            this._joins.push(`LEFT JOIN "${relatedTable}" ON "${this._tableName}"."id" = "${relatedTable}"."${rel.foreignKey}"`);
            // Aggregate child rows into a JSON array; FILTER removes the NULL sentinel row
            // produced by the LEFT JOIN when there are no children.
            this._columns.push(`COALESCE(json_agg("${relatedTable}".*) FILTER (WHERE "${relatedTable}".id IS NOT NULL), '[]') AS "${relationName}"`);
            // PostgreSQL allows GROUP BY <primary_key> when the PK functionally determines
            // all other columns (PostgreSQL 9.1+), so "users".* in SELECT is safe here.
            this._groupBy.push(`"${this._tableName}".id`);
        }
    }
    // ---------------------------------------------------------------------------
    // WHERE  (supports Prisma-style operators)
    // ---------------------------------------------------------------------------
    where(conditions) {
        Object.entries(conditions).forEach(([key, value]) => {
            // Qualify column name with table to prevent ambiguity on joins
            const colName = key.includes(".") ? key : `"${this._tableName}"."${key}"`;
            if (typeof value === "object" &&
                value !== null &&
                !Array.isArray(value)) {
                // Operator object: { age: { gt: 18 } }
                const ops = value;
                Object.entries(ops).forEach(([op, val]) => {
                    this._params.push(val);
                    switch (op) {
                        case "gt":
                            this._conditions.push(`${colName} > ??`);
                            break;
                        case "lt":
                            this._conditions.push(`${colName} < ??`);
                            break;
                        case "gte":
                            this._conditions.push(`${colName} >= ??`);
                            break;
                        case "lte":
                            this._conditions.push(`${colName} <= ??`);
                            break;
                        case "contains":
                            this._conditions.push(`${colName} LIKE ??`);
                            break;
                        case "startsWith":
                            this._conditions.push(`${colName} LIKE ??`);
                            break;
                        case "endsWith":
                            this._conditions.push(`${colName} LIKE ??`);
                            break;
                        case "not":
                            this._conditions.push(`${colName} != ??`);
                            break;
                        case "in":
                            // val is expected to be an array
                            if (Array.isArray(val) && val.length > 0) {
                                // Remove the param we just pushed — we'll push individually below
                                this._params.pop();
                                const placeholders = val.map((v) => {
                                    this._params.push(v);
                                    return "??";
                                });
                                this._conditions.push(`${colName} IN (${placeholders.join(", ")})`);
                            }
                            break;
                        default:
                            // Unknown operator — skip silently (could also throw here)
                            this._params.pop();
                    }
                });
            }
            else {
                // Simple equality: { name: "Tunde" }
                this._conditions.push(`${colName} = ??`);
                this._params.push(value);
            }
        });
        return this;
    }
    // ---------------------------------------------------------------------------
    // ORDER BY
    // ---------------------------------------------------------------------------
    /**
     * Add an ORDER BY clause.
     *
     * @example
     * .orderBy("createdAt", "DESC")
     * .orderBy("name")           // defaults to ASC
     */
    orderBy(column, direction = "ASC") {
        this._orderBy.push({ column, direction });
        return this;
    }
    // ---------------------------------------------------------------------------
    // LIMIT / OFFSET
    // ---------------------------------------------------------------------------
    limit(n) {
        this._limit = n;
        return this;
    }
    offset(n) {
        this._offset = n;
        return this;
    }
    // ---------------------------------------------------------------------------
    // INSERT / UPDATE / DELETE helpers
    // ---------------------------------------------------------------------------
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
    // ---------------------------------------------------------------------------
    // SQL GENERATION
    // ---------------------------------------------------------------------------
    toSQL() {
        let paramCounter = 0;
        // Replaces the next "??" placeholder with the correct positional parameter
        // ($1, $2, … for Postgres).
        const nextParam = () => {
            const placeholder = this._adapter
                ? this._adapter.getPlaceholder(paramCounter)
                : `$${paramCounter + 1}`;
            paramCounter++;
            return placeholder;
        };
        // --- INSERT ---
        if (this._operation === "INSERT") {
            const keys = Object.keys(this._data);
            const values = Object.values(this._data);
            const columns = keys.map((k) => `"${k}"`).join(", ");
            const placeholders = keys.map(() => nextParam()).join(", ");
            return {
                sql: `INSERT INTO "${this._tableName}" (${columns}) VALUES (${placeholders}) RETURNING *;`,
                params: values,
            };
        }
        // --- UPDATE ---
        if (this._operation === "UPDATE") {
            const keys = Object.keys(this._data);
            const values = Object.values(this._data);
            const setClause = keys.map((k) => `"${k}" = ${nextParam()}`).join(", ");
            let sql = `UPDATE "${this._tableName}" SET ${setClause}`;
            if (this._conditions.length > 0) {
                const whereClause = this._conditions
                    .map((c) => c.replace("??", nextParam()))
                    .join(" AND ");
                sql += ` WHERE ${whereClause}`;
            }
            return {
                sql: sql + " RETURNING *;",
                params: [...values, ...this._params],
            };
        }
        // --- DELETE ---
        if (this._operation === "DELETE") {
            let sql = `DELETE FROM "${this._tableName}"`;
            if (this._conditions.length > 0) {
                const whereClause = this._conditions
                    .map((c) => c.replace("??", nextParam()))
                    .join(" AND ");
                sql += ` WHERE ${whereClause}`;
            }
            return { sql: sql + ";", params: this._params };
        }
        // --- SELECT ---
        const selection = this._columns.join(", ");
        let sql = `SELECT ${selection} FROM "${this._tableName}"`;
        if (this._joins.length > 0) {
            sql += ` ${this._joins.join(" ")}`;
        }
        if (this._conditions.length > 0) {
            const whereClause = this._conditions
                .map((c) => c.replace("??", nextParam()))
                .join(" AND ");
            sql += ` WHERE ${whereClause}`;
        }
        if (this._groupBy.length > 0) {
            sql += ` GROUP BY ${this._groupBy.join(", ")}`;
        }
        if (this._orderBy.length > 0) {
            const orderClause = this._orderBy
                .map((o) => `"${this._tableName}"."${o.column}" ${o.direction}`)
                .join(", ");
            sql += ` ORDER BY ${orderClause}`;
        }
        if (this._limit !== undefined) {
            sql += ` LIMIT ${this._limit}`;
        }
        if (this._offset !== undefined) {
            sql += ` OFFSET ${this._offset}`;
        }
        return { sql: sql + ";", params: this._params };
    }
}
exports.QueryBuilder = QueryBuilder;
