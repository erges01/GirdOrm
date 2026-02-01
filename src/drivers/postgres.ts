import { Pool, PoolClient } from "pg";
import { DBAdapter } from "../core/adapter";

// 1. Main Adapter (Manages the Pool)
export class PostgresAdapter implements DBAdapter {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }, // Required for Neon/Production
    });
  }

  // Used by Model to run standard queries
  async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    const res = await this.pool.query(sql, params);
    return res.rows; // We return rows directly so Model matches T[]
  }

  // Used by reset.ts to kill the connection
  async close() {
    await this.pool.end();
  }

  // Used by GirdDB.transaction() to get a locked connection
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  getPlaceholder(index: number): string {
    return `$${index + 1}`;
  }
}

// 2. Transaction Adapter (Locks to ONE Client)
export class TransactionAdapter implements DBAdapter {
  constructor(private client: PoolClient) {}

  async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    const res = await this.client.query(sql, params);
    return res.rows;
  }

  getPlaceholder(index: number): string {
    return `$${index + 1}`;
  }
  
  // No-op: We don't close the pool inside a transaction
  async close() {} 
}