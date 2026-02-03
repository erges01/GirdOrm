// src/core/adapter.ts

// Export QueryResult type to prevent "Module has no exported member" errors
export type QueryResult<T = any> = T[];

export interface DBAdapter {
  // Generic query: Returns an array of type T (the rows)
  query<T>(sql: string, params?: any[]): Promise<T[]>;

  // Required by Migrator to run raw SQL checks
  queryRaw(sql: string, params?: any[]): Promise<any[]>;

  // Helper for $1 (Postgres) vs ? (SQLite) placeholders
  getPlaceholder(index: number): string;

  // Cleanup connection
  close(): Promise<void>;
}