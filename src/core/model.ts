import { QueryBuilder } from "./builder";
import { DBAdapter } from "./adapter"; 
import { DbColumn } from "./table"; 

export interface FindOptions {
  with?: string;
}

export class Model<T = any> {
  static tableName: string;
  static adapter: DBAdapter; 
  
  [key: string]: any; 

  // --- 1. CREATE ---
  static async create<T>(this: new () => T, data: Partial<T>): Promise<T> {
    const model = this as any;
    // 👇 FIX: Pass 'model' directly so Builder can read @HasMany metadata
    const q = new QueryBuilder(model, model.adapter)
        .insert(data as Record<string, any>);
    
    const { sql, params } = q.toSQL();
    const res = await model.adapter.query(sql, params);
    return res[0];
  }

  // --- 2. READ (Single) ---
  static async get<T>(this: new () => T, id: number | string, options: FindOptions = {}): Promise<T | null> {
    const model = this as any;
    // 👇 FIX
    const q = new QueryBuilder(model, model.adapter)
        .select("*")
        .where({ id });
    
    if (options.with) q.with(options.with);

    const { sql, params } = q.toSQL();
    const res = await model.adapter.query(sql, params);
    return res[0] || null;
  }

  // --- 3. READ (Many) ---
  static async find<T>(this: new () => T, conditions: Partial<T> | Record<string, any> = {}, options: FindOptions = {}): Promise<T[]> {
    const model = this as any;
    // 👇 FIX
    const q = new QueryBuilder(model, model.adapter)
        .select("*")
        .where(conditions as Record<string, any>);
    
    if (options.with) q.with(options.with);

    const { sql, params } = q.toSQL();
    return await model.adapter.query(sql, params);
  }

  // --- 4. READ (All) ---
  static async all<T>(this: new () => T): Promise<T[]> {
    return (this as any).find({});
  }

  // --- 5. UPDATE ---
  static async update<T>(this: new () => T, id: number | string, data: Partial<T>) {
    const model = this as any;
    // 👇 FIX
    const q = new QueryBuilder(model, model.adapter)
        .update(data as Record<string, any>)
        .where({ id });
        
    const { sql, params } = q.toSQL();
    return await model.adapter.query(sql, params);
  }

  // --- 6. DELETE ---
  static async delete<T>(this: new () => T, id: number | string) {
    const model = this as any;
    // 👇 FIX
    const q = new QueryBuilder(model, model.adapter)
        .delete()
        .where({ id });

    const { sql, params } = q.toSQL();
    return await model.adapter.query(sql, params);
  }

  // --- INSTANCE METHODS ---
  async save(): Promise<this> {
    return this;
  }
}