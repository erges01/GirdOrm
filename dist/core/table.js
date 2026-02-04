"use strict";
// girdORM/src/core/table.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.Table = exports.bool = exports.text = exports.int = exports.DbColumn = void 0;
exports.table = table;
// <T> is a "Phantom Type". It tells TypeScript what kind of data this column holds.
// RENAMED from 'Column' to 'DbColumn' to avoid conflict with the @Column decorator
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
// Helpers now return Typed DbColumns
const int = () => new DbColumn("INTEGER");
exports.int = int;
const text = () => new DbColumn("TEXT");
exports.text = text;
const bool = () => new DbColumn("BOOLEAN");
exports.bool = bool;
class Table {
    // We added 'relations' as an optional third argument
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
// 4. Updated 'table' function to capture types AND accept relations
function table(name, columns, relations = {}) {
    return new Table(name, columns, relations);
}
