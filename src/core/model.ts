import { Table } from "./table";
import { QueryBuilder } from "./builder";
import { DBAdapter } from "./adapter"; 

export interface FindOptions {
  with?: string;
}

export class Model<T> {
  constructor(private adapter: DBAdapter, private table: Table) {}

  // 1. CREATE
  async create(data: Partial<T>): Promise<T> {
    const q = new QueryBuilder(this.table, this.adapter).insert(data as Record<string, any>);
    const { sql, params } = q.toSQL();
    
    const res = await this.adapter.query<T>(sql, params);
    // FIX: Add '!' to assert it's defined (Create always returns data in Postgres)
    return res[0]!;
  }

  // 2. READ (Single)
  async get(id: number | string, options: FindOptions = {}): Promise<T | null> {
    const q = new QueryBuilder(this.table, this.adapter)
        .select("*")
        .where({ id });
    
    if (options.with) {
      q.with(options.with);
    }

    const { sql, params } = q.toSQL();
    const res = await this.adapter.query<T>(sql, params);
    return res[0] || null;
  }

  // 3. READ (Many)
  async find(conditions: Partial<T> | Record<string, any>, options: FindOptions = {}): Promise<T[]> {
    const q = new QueryBuilder(this.table, this.adapter)
        .select("*")
        .where(conditions as Record<string, any>);
    
    if (options.with) {
      q.with(options.with);
    }

    const { sql, params } = q.toSQL();
    return await this.adapter.query<T>(sql, params);
  }

  // 4. READ (All)
  async all(): Promise<T[]> {
    return this.find({});
  }

  // 5. UPDATE
  async update(id: number | string, data: Partial<T>) {
    const q = new QueryBuilder(this.table, this.adapter)
        .update(data as Record<string, any>)
        .where({ id });
        
    const { sql, params } = q.toSQL();
    return await this.adapter.query(sql, params);
  }

  // 6. DELETE
  async delete(id: number | string) {
    const q = new QueryBuilder(this.table, this.adapter)
        .delete()
        .where({ id });

    const { sql, params } = q.toSQL();
    return await this.adapter.query(sql, params);
  }
}