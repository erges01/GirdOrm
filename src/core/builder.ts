import { Table } from "./table";
import { DBAdapter } from "./adapter"; 

export class QueryBuilder {
  private _table: Table;
  private _columns: string[] = []; 
  private _conditions: string[] = [];
  private _params: any[] = [];
  private _joins: string[] = []; 
  
  // NEW: Store the Adapter so we can ask for placeholders
  private _adapter?: DBAdapter;

  // NEW: Support Update and Delete operations
  private _operation: "SELECT" | "INSERT" | "UPDATE" | "DELETE" = "SELECT";
  private _data: Record<string, any> = {}; 

  // Updated Constructor: Accepts an optional adapter
  constructor(table: Table, adapter?: DBAdapter) {
    this._table = table;
    this._adapter = adapter;
  }

  select(...columns: string[]) {
    this._operation = "SELECT";
    if (columns.length > 0) this._columns = columns;
    return this;
  }

  where(conditions: Record<string, any>) {
    Object.entries(conditions).forEach(([key, value]) => {
      // Smart fix: If key doesn't have a dot (id), make it (users.id) to avoid ambiguity
      const colName = key.includes(".") ? key : `${this._table.tableName}.${key}`;
      
      // We push a generic "?" for now. 
      // The toSQL() method will convert this to "$1" for Postgres later.
      this._conditions.push(`${colName} = ?`);
      this._params.push(value);
    });
    return this;
  }

  // Usage: .leftJoin('users', 'authorId', 'id')
  leftJoin(otherTable: string, localCol: string, otherCol: string) {
    this._joins.push(
      `LEFT JOIN ${otherTable} ON ${this._table.tableName}.${localCol} = ${otherTable}.${otherCol}`
    );
    return this;
  }

  insert(data: Record<string, any>) {
    this._operation = "INSERT";
    this._data = data;
    return this;
  }

  // --- NEW: Update Mode ---
  update(data: Record<string, any>) {
    this._operation = "UPDATE";
    this._data = data;
    return this;
  }

  // --- NEW: Delete Mode ---
  delete() {
    this._operation = "DELETE";
    return this;
  }

  // --- THE COMPLEX PART: Generating SQL with correct placeholders ---
  toSQL(): { sql: string; params: any[] } {
    let paramCounter = 0;
    
    // Helper: Returns "?" or "$1" and increments counter
    const nextParam = () => {
        const p = this._adapter ? this._adapter.getPlaceholder(paramCounter) : "?";
        paramCounter++;
        return p;
    };

    // 1. INSERT Logic
    if (this._operation === "INSERT") {
      const keys = Object.keys(this._data);
      const values = Object.values(this._data);
      
      // Generate "$1, $2" or "?, ?" based on adapter
      const placeholders = keys.map(() => nextParam()).join(", ");
      
      return {
        sql: `INSERT INTO ${this._table.tableName} (${keys.join(", ")}) VALUES (${placeholders});`,
        params: values,
      };
    }

    // 2. UPDATE Logic
    if (this._operation === "UPDATE") {
      const keys = Object.keys(this._data);
      const values = Object.values(this._data);
      
      // "name = $1, email = $2"
      const setClause = keys.map((k) => `${k} = ${nextParam()}`).join(", ");
      
      let sql = `UPDATE ${this._table.tableName} SET ${setClause}`;
      
      // Handle WHERE clause params (they come after SET params)
      if (this._conditions.length > 0) {
        const whereClause = this._conditions.map(c => c.replace("?", nextParam())).join(" AND ");
        sql += ` WHERE ${whereClause}`;
      }
      
      return { sql: sql + ";", params: [...values, ...this._params] };
    }

    // 3. DELETE Logic
    if (this._operation === "DELETE") {
      let sql = `DELETE FROM ${this._table.tableName}`;
      if (this._conditions.length > 0) {
        const whereClause = this._conditions.map(c => c.replace("?", nextParam())).join(" AND ");
        sql += ` WHERE ${whereClause}`;
      }
      return { sql: sql + ";", params: this._params };
    }

    // 4. SELECT Logic (Default)
    const selection = this._columns.length > 0 ? this._columns.join(", ") : `${this._table.tableName}.*`;
    let sql = `SELECT ${selection} FROM ${this._table.tableName}`;
    
    if (this._joins.length > 0) sql += ` ${this._joins.join(" ")}`;
    
    if (this._conditions.length > 0) {
       // Replace "?" with real placeholders
       const whereClause = this._conditions.map(c => c.replace("?", nextParam())).join(" AND ");
       sql += ` WHERE ${whereClause}`;
    }
    
    return { sql: sql + ";", params: this._params };
  }
}