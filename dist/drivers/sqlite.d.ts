import { DBAdapter, QueryResult } from "../core/adapter";
export declare class SQLiteAdapter implements DBAdapter {
    private db;
    constructor(filename: string);
    connect(): Promise<void>;
    query(sql: string, params: any[]): Promise<QueryResult>;
    disconnect(): Promise<void>;
    getPlaceholder(index: number): string;
}
