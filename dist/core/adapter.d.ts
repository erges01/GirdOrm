export type QueryResult<T = any> = T[];
export interface DBAdapter {
    query<T>(sql: string, params?: any[]): Promise<T[]>;
    queryRaw(sql: string, params?: any[]): Promise<any[]>;
    getPlaceholder(index: number): string;
    close(): Promise<void>;
}
