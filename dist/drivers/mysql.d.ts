import { DBAdapter, QueryResult } from "../core/adapter";
export declare class MySQLAdapter implements DBAdapter {
    private uri;
    private connection;
    constructor(uri: string);
    connect(): Promise<void>;
    query(sql: string, params: any[]): Promise<QueryResult>;
    disconnect(): Promise<void>;
    getPlaceholder(index: number): string;
}
