import { Pool } from "pg";
import { DBAdapter, QueryResult } from "../core/adapter";

export class PostgresAdapter implements DBAdapter {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  async connect() {
    // Test the connection
    const client = await this.pool.connect();
    client.release(); // Put it back in the pool
    // console.log("✅ Connected to Postgres");
  }

  async query(sql: string, params: any[]): Promise<QueryResult> {
    // Postgres handles Booleans natively, so no need to sanitize!
    const res = await this.pool.query(sql, params);
    
    return {
      rows: res.rows,
      // Postgres returns 'rowCount'
      affectedRows: res.rowCount || 0
    };
  }

  async disconnect() {
    await this.pool.end();
  }

  // Postgres uses "$1", "$2", "$3"... 
  // This is the tricky part our Builder needs to handle!
  getPlaceholder(index: number): string {
    return `$${index + 1}`;
  }
}