import mysql from "mysql2/promise";
import { DBAdapter, QueryResult } from "../core/adapter";

export class MySQLAdapter implements DBAdapter {
  private connection: mysql.Connection | null = null;

  constructor(private uri: string) {}

  async connect() {
    this.connection = await mysql.createConnection(this.uri);
    // console.log("✅ Connected to MySQL");
  }

  async query(sql: string, params: any[]): Promise<QueryResult> {
    if (!this.connection) throw new Error("Not connected to MySQL");

    // MySQL uses ? just like SQLite, so it's easy!
    const [rows, fields] = await this.connection.execute(sql, params);
    
    // MySQL returns metadata differently for SELECT vs INSERT
    if (Array.isArray(rows)) {
        return { rows };
    } else {
        return { rows: [], affectedRows: (rows as any).affectedRows };
    }
  }

  async disconnect() {
    if (this.connection) await this.connection.end();
  }

  // MySQL uses "?"
  getPlaceholder(index: number): string {
    return "?";
  }
}