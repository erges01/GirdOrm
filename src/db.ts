import { DBAdapter } from "./core/adapter";
import { Table, Infer } from "./core/table";
import { Model } from "./core/model";

export class GirdDB {
  private adapter: DBAdapter;

  constructor(adapter: DBAdapter) {
    this.adapter = adapter;
  }

  // 1. Initialize Connection
  async init() {
    await this.adapter.connect();
  }

  // 2. Define a Model (Connects Schema -> Adapter)
  table<T extends Table>(schema: T) {
    return new Model<Infer<T>>(this.adapter, schema);
  }

  // --- NEW HELPERS (Fixes the Migrator Errors) ---

  // Helper A: Run a command that doesn't return rows (e.g. CREATE TABLE, INSERT)
  async execute(sql: string) {
    return await this.adapter.query(sql, []);
  }

  // Helper B: Run a query that returns raw rows (e.g. PRAGMA table_info)
  // This is used by the Migrator to check if tables exist
  async queryRaw(sql: string) {
    const res = await this.adapter.query(sql, []);
    return res.rows; 
  }

  // 3. Close Connection
  async close() {
    await this.adapter.disconnect();
  }
}