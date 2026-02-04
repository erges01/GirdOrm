import { DBAdapter } from "./core/adapter";
import { Model } from "./core/model";
export declare class GirdDB {
    readonly adapter: DBAdapter;
    models: (typeof Model)[];
    constructor(adapter: DBAdapter);
    init(): Promise<void>;
    register(models: (typeof Model)[]): void;
    execute(sql: string, params?: any[]): Promise<unknown[]>;
    queryRaw(sql: string, params?: any[]): Promise<unknown[]>;
    close(): Promise<void>;
    transaction(callback: (tx: GirdDB) => Promise<void>): Promise<void>;
}
