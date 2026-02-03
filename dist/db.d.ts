import { DBAdapter } from "./core/adapter";
import { Table, Infer } from "./core/table";
import { Model } from "./core/model";
export declare class GirdDB {
    readonly adapter: DBAdapter;
    constructor(adapter: DBAdapter);
    init(): Promise<void>;
    table<T extends Table>(schema: T): Model<Infer<T>>;
    execute(sql: string, params?: any[]): Promise<unknown[]>;
    queryRaw(sql: string, params?: any[]): Promise<unknown[]>;
    close(): Promise<void>;
    transaction(callback: (tx: GirdDB) => Promise<void>): Promise<void>;
}
