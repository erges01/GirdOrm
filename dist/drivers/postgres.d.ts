import { PoolClient } from "pg";
import { DBAdapter } from "../core/adapter";
export declare class PostgresAdapter implements DBAdapter {
    private pool;
    constructor(connectionString: string);
    query<T>(sql: string, params?: any[]): Promise<T[]>;
    queryRaw(sql: string, params?: any[]): Promise<any[]>;
    close(): Promise<void>;
    getClient(): Promise<PoolClient>;
    getPlaceholder(index: number): string;
}
export declare class TransactionAdapter implements DBAdapter {
    private client;
    constructor(client: PoolClient);
    query<T>(sql: string, params?: any[]): Promise<T[]>;
    queryRaw(sql: string, params?: any[]): Promise<any[]>;
    getPlaceholder(index: number): string;
    close(): Promise<void>;
}
