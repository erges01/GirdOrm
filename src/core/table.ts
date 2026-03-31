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

/** @deprecated Use the \`@Column\` decorator on a class that extends \`Model\` instead. */
export type ColumnType = "INTEGER" | "TEXT" | "BOOLEAN";

/**
 * @deprecated Use the \`@Column\` decorator on a class that extends \`Model\` instead.
 *
 * <T> is a "Phantom Type" that tells TypeScript what kind of data this column holds.
 * RENAMED from 'Column' to 'DbColumn' to avoid conflict with the @Column decorator.
 */
export class DbColumn<T> {
  public isPrimaryKey = false;
  public foreignKey?: { table: string; column: string };

  constructor(public type: ColumnType) {}

  // 1. Mark as Primary Key (e.g., id)
  primaryKey() {
    this.isPrimaryKey = true;
    return this;
  }

  // 2. Mark as Foreign Key (e.g., points to users.id)
  references(tableName: string, columnName: string = "id") {
    this.foreignKey = { table: tableName, column: columnName };
    return this;
  }
}

/** @deprecated Use \`@Column({ type: "int" })\` on a Model class instead. */
export const int = () => new DbColumn<number>("INTEGER");

/** @deprecated Use \`@Column({ type: "text" })\` on a Model class instead. */
export const text = () => new DbColumn<string>("TEXT");

/** @deprecated Use \`@Column({ type: "boolean" })\` on a Model class instead. */
export const bool = () => new DbColumn<boolean>("BOOLEAN");

/** @deprecated Use \`@HasMany\` / \`@BelongsTo\` decorators on a Model class instead. */
export interface RelationDef {
  type: "belongsTo" | "hasMany";
  table: string;
  localKey: string;
  foreignKey: string;
}

/** @deprecated Use a class that extends \`Model\` with \`@Column\` decorators instead. */
export class Table<Schema = any> {
  constructor(
    public tableName: string,
    public columns: Record<string, DbColumn<any>>, // Updated type
    public relations: Record<string, RelationDef> = {},
  ) {}

  toSQL(): string {
    const colDefs: string[] = [];
    const foreignKeys: string[] = [];

    Object.entries(this.columns).forEach(([name, col]) => {
      let def = `"${name}"`; // Quote column names for safety

      // --- POSTGRES FIX ---
      // If it's an Integer PK, use SERIAL for auto-increment
      if (col.isPrimaryKey && col.type === "INTEGER") {
        def += " SERIAL PRIMARY KEY";
      } else {
        def += ` ${col.type}`;
        if (col.isPrimaryKey) def += " PRIMARY KEY";
      }

      colDefs.push(def);

      if (col.foreignKey) {
        foreignKeys.push(
          `FOREIGN KEY ("${name}") REFERENCES "${col.foreignKey.table}"("${col.foreignKey.column}")`,
        );
      }
    });

    const body = [...colDefs, ...foreignKeys].join(", ");
    return `CREATE TABLE IF NOT EXISTS "${this.tableName}" (${body});`;
  }
}

// --- TYPE MAGIC ---

/** @deprecated Infer types from a Model subclass instead. */
export type Infer<T> = T extends Table<infer S> ? S : never;

/** @deprecated Define your schema as a class extending \`Model\` instead. */
export function table<T extends Record<string, DbColumn<any>>>(
  name: string,
  columns: T,
  relations: Record<string, RelationDef> = {},
): Table<{ [K in keyof T]: T[K] extends DbColumn<infer U> ? U : never }> {
  return new Table(name, columns, relations);
}
