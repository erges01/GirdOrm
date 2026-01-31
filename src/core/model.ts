import { Table } from "./table";
import { QueryBuilder } from "./builder";
import { DBAdapter } from "./adapter"; 

export interface FindOptions {
  with?: string;
}

// <T> represents the Shape of the Data (e.g. { id: number, name: string })
export class Model<T> {
  // We accept the generic DBAdapter instead of GirdDB
  constructor(private adapter: DBAdapter, private table: Table) {}

  // 1. CREATE
  async create(data: Partial<T>) {
    // FIX: Cast 'data' to satisfy QueryBuilder types
    const q = new QueryBuilder(this.table, this.adapter).insert(data as Record<string, any>);
    const { sql, params } = q.toSQL();
    
    return await this.adapter.query(sql, params);
  }

  // 2. READ (Single)
  async get(id: number | string, options: FindOptions = {}): Promise<T | null> {
    // FIX: Added explicit cast here too, just to be safe
    const conditions = { [`${this.table.tableName}.id`]: id } as Record<string, any>;
    const q = new QueryBuilder(this.table, this.adapter).where(conditions);
    
    if (options.with) {
      this.applyJoin(q, options.with);
    }

    const { sql, params } = q.toSQL();
    const res = await this.adapter.query(sql, params);
    
    const row = res.rows[0];
    
    if (!row) return null;

    return options.with ? (this.hydrate(row, options.with) as T) : (row as T);
  }

  // 3. READ (Many)
  async find(conditions: Partial<T>): Promise<T[]> {
    // FIX: Cast 'conditions' to satisfy QueryBuilder
    const q = new QueryBuilder(this.table, this.adapter).where(conditions as Record<string, any>);
    const { sql, params } = q.toSQL();
    
    const res = await this.adapter.query(sql, params);
    return res.rows as T[];
  }

  async all(): Promise<T[]> {
    const q = new QueryBuilder(this.table, this.adapter);
    const { sql, params } = q.toSQL();
    
    const res = await this.adapter.query(sql, params);
    return res.rows as T[];
  }

  // 4. UPDATE
  async update(id: number | string, data: Partial<T>) {
    const q = new QueryBuilder(this.table, this.adapter)
        .update(data as Record<string, any>) // FIX: Cast 'data'
        .where({ id });
        
    const { sql, params } = q.toSQL();
    return await this.adapter.query(sql, params);
  }

  // 5. DELETE
  async delete(id: number | string) {
    const q = new QueryBuilder(this.table, this.adapter)
        .delete()
        .where({ id });

    const { sql, params } = q.toSQL();
    return await this.adapter.query(sql, params);
  }

  // --- INTERNAL HELPER: Add the JOIN SQL ---
  private applyJoin(q: QueryBuilder, relationName: string) {
    const foreignCol = Object.entries(this.table.columns).find(
      ([_, col]) => col.foreignKey?.table === relationName
    );

    if (!foreignCol) {
      throw new Error(`Relation '${relationName}' not found in table '${this.table.tableName}'`);
    }

    const [colName, colDef] = foreignCol;
    
    // FIX: The '!' tells TypeScript that foreignKey definitely exists here
    const targetTable = colDef.foreignKey!.table; 
    const targetId = colDef.foreignKey!.column;   

    q.select(
      `${this.table.tableName}.*`, 
      `"${targetTable}".id as ${targetTable}_id`,
      `"${targetTable}".name as ${targetTable}_name`,
      `"${targetTable}".email as ${targetTable}_email`
    );

    q.leftJoin(targetTable, colName, targetId);
  }

  // --- INTERNAL HELPER: Nest the data ---
  private hydrate(row: any, relationName: string) {
    if (!row) return null;
    const output = { ...row };
    const nested: any = {};
    let hasData = false;

    Object.keys(row).forEach(key => {
      if (key.startsWith(`${relationName}_`)) {
        const cleanKey = key.replace(`${relationName}_`, ""); 
        nested[cleanKey] = row[key];
        delete output[key]; 
        if (row[key] !== null) hasData = true;
      }
    });

    if (hasData) {
      output[relationName] = nested; 
    }
    return output;
  }
}