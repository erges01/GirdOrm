// girdORM/src/core/table.ts

export type ColumnType = "INTEGER" | "TEXT" | "BOOLEAN";

// <T> is a "Phantom Type". It tells TypeScript what kind of data this column holds.
export class Column<T> {
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

// Helpers now return Typed Columns
export const int = () => new Column<number>("INTEGER");
export const text = () => new Column<string>("TEXT");
export const bool = () => new Column<boolean>("BOOLEAN");

// --- NEW: Relation Definitions ---
export interface RelationDef {
  type: "belongsTo" | "hasMany";
  table: string;
  localKey: string;
  foreignKey: string;
}

export class Table<Schema = any> {
  // We added 'relations' as an optional third argument
  constructor(
    public tableName: string,
    public columns: Record<string, Column<any>>,
    public relations: Record<string, RelationDef> = {} 
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
          `FOREIGN KEY ("${name}") REFERENCES "${col.foreignKey.table}"("${col.foreignKey.column}")`
        );
      }
    });

    const body = [...colDefs, ...foreignKeys].join(", ");
    return `CREATE TABLE IF NOT EXISTS "${this.tableName}" (${body});`;
  }
}

// --- TYPE MAGIC ---

// 3. The Magic Type Extractor
export type Infer<T> = T extends Table<infer S> ? S : never;

// 4. Updated 'table' function to capture types AND accept relations
export function table<T extends Record<string, Column<any>>>(
  name: string, 
  columns: T,
  relations: Record<string, RelationDef> = {}
): Table<{ [K in keyof T]: T[K] extends Column<infer U> ? U : never }> {
  return new Table(name, columns, relations);
}