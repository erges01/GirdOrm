import { Table } from "./table";
import { DBAdapter } from "./adapter";
export interface FindOptions {
    with?: string;
}
export declare class Model<T> {
    private adapter;
    private table;
    constructor(adapter: DBAdapter, table: Table);
    create(data: Partial<T>): Promise<T>;
    get(id: number | string, options?: FindOptions): Promise<T | null>;
    find(conditions: Partial<T> | Record<string, any>, options?: FindOptions): Promise<T[]>;
    all(): Promise<T[]>;
    update(id: number | string, data: Partial<T>): Promise<unknown[]>;
    delete(id: number | string): Promise<unknown[]>;
}
