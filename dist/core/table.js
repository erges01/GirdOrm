"use strict";
// girdORM/src/core/table.ts
//
// ⚠️  DEPRECATED
// ─────────────────────────────────────────────────────────────────────────────
// This file contains the original schema-definition API (Table, DbColumn,
// int(), text(), bool(), table()). It has been superseded by the decorator-
// based Model system which is the canonical way to define models in GirdORM.
//
// INSTEAD, use:
//
//   import { Model, Column, HasMany, BelongsTo } from "girdorm";
//
//   class User extends Model {
//     static tableName = "users";
//
//     @Column({ type: "int", primary: true, generated: true })
//     id!: number;
//
//     @Column({ type: "text" })
//     name!: string;
//   }
//
// This file is kept only for backwards-compatibility and will be removed in
// a future major version. Do NOT use it in new code.
// ─────────────────────────────────────────────────────────────────────────────
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = exports.bool = exports.text = exports.int = exports.DbColumn = void 0;
exports.table = table;
/**
 * @deprecated Use the \`@Column\` decorator on a class that extends \`Model\` instead.
 *
 * <T> is a "Phantom Type" that tells TypeScript what kind of data this column holds.
 * RENAMED from 'Column' to 'DbColumn' to avoid conflict with the @Column decorator.
 */
class DbColumn {
    constructor(type) {
        this.type = type;
        this.isPrimaryKey = false;
    }
    // 1. Mark as Primary Key (e.g., id)
    primaryKey() {
        this.isPrimaryKey = true;
        return this;
    }
    // 2. Mark as Foreign Key (e.g., points to users.id)
    references(tableName, columnName = "id") {
        this.foreignKey = { table: tableName, column: columnName };
        return this;
    }
}
exports.DbColumn = DbColumn;
/** @deprecated Use \`@Column({ type: "int" })\` on a Model class instead. */
const int = () => new DbColumn("INTEGER");
exports.int = int;
/** @deprecated Use \`@Column({ type: "text" })\` on a Model class instead. */
const text = () => new DbColumn("TEXT");
exports.text = text;
/** @deprecated Use \`@Column({ type: "boolean" })\` on a Model class instead. */
const bool = () => new DbColumn("BOOLEAN");
exports.bool = bool;
/** @deprecated Use a class that extends \`Model\` with \`@Column\` decorators instead. */
class Table {
    constructor(tableName, columns, // Updated type
    relations = {}) {
        this.tableName = tableName;
        this.columns = columns;
        this.relations = relations;
    }
    toSQL() {
        const colDefs = [];
        const foreignKeys = [];
        Object.entries(this.columns).forEach(([name, col]) => {
            let def = `"${name}"`; // Quote column names for safety
            // --- POSTGRES FIX ---
            // If it's an Integer PK, use SERIAL for auto-increment
            if (col.isPrimaryKey && col.type === "INTEGER") {
                def += " SERIAL PRIMARY KEY";
            }
            else {
                def += ` ${col.type}`;
                if (col.isPrimaryKey)
                    def += " PRIMARY KEY";
            }
            colDefs.push(def);
            if (col.foreignKey) {
                foreignKeys.push(`FOREIGN KEY ("${name}") REFERENCES "${col.foreignKey.table}"("${col.foreignKey.column}")`);
            }
        });
        const body = [...colDefs, ...foreignKeys].join(", ");
        return `CREATE TABLE IF NOT EXISTS "${this.tableName}" (${body});`;
    }
}
exports.Table = Table;
/** @deprecated Define your schema as a class extending \`Model\` instead. */
function table(name, columns, relations = {}) {
    return new Table(name, columns, relations);
}
