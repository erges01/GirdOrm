// src/core/adapter.ts

export interface QueryResult {
  rows: any[];
  affectedRows?: number; // Needed for UPDATE/DELETE checks
}

export interface DBAdapter {
  // 1. Connect to the database
  connect(): Promise<void>;
  
  // 2. Run a query and return unified results
  query(sql: string, params: any[]): Promise<QueryResult>;
  
  // 3. Disconnect
  disconnect(): Promise<void>;

  // 4. Handle dialect differences
  // SQLite uses "?"
  // Postgres uses "$1", "$2", "$3"...
  getPlaceholder(index: number): string;
}