import { DBAdapter } from "./adapter";
export interface FindOptions {
    with?: string;
}
export declare class Model<T = any> {
    static tableName: string;
    static adapter: DBAdapter;
    [key: string]: any;
    static create<T>(this: new () => T, data: Partial<T>): Promise<T>;
    static get<T>(this: new () => T, id: number | string, options?: FindOptions): Promise<T | null>;
    static find<T>(this: new () => T, conditions?: Partial<T> | Record<string, any>, options?: FindOptions): Promise<T[]>;
    static all<T>(this: new () => T): Promise<T[]>;
    static update<T>(this: new () => T, id: number | string, data: Partial<T>): Promise<any>;
    static delete<T>(this: new () => T, id: number | string): Promise<any>;
    save(): Promise<this>;
}
