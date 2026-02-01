// A generic interface for ANY database driver (Postgres, SQLite, MySQL)
export interface DBAdapter {
  // Generic query: Returns an array of type T (the rows)
  query<T>(sql: string, params?: any[]): Promise<T[]>;

  // Helper for $1 (Postgres) vs ? (SQLite) placeholders
  getPlaceholder(index: number): string;

  // Cleanup connection
  close(): Promise<void>;

  // Optional: For Transactions (returns a raw client)
  getClient?(): Promise<any>; 
}