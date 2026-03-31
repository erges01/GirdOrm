import "reflect-metadata";
import { DBAdapter } from "./adapter";
export interface OrderByOption {
    column: string;
    direction?: "ASC" | "DESC";
}
export interface FindOptions {
    /** Eager-load one or more relations defined with @HasMany / @BelongsTo */
    with?: string | string[];
    /** Sort results. Pass a column name string or a { column, direction } object */
    orderBy?: string | OrderByOption;
    /** Maximum number of rows to return */
    limit?: number;
    /** Number of rows to skip (for pagination) */
    offset?: number;
}
export declare class Model {
    /** Set by GirdDB.register() */
    static tableName: string;
    /** Set by GirdDB.register() */
    static adapter: DBAdapter;
    static create<T extends Model>(this: new () => T, data: Partial<T>): Promise<T>;
    static get<T extends Model>(this: new () => T, id: number | string, options?: FindOptions): Promise<T | null>;
    static find<T extends Model>(this: new () => T, conditions?: Partial<T> | Record<string, any>, options?: FindOptions): Promise<T[]>;
    static all<T extends Model>(this: new () => T, options?: FindOptions): Promise<T[]>;
    static update<T extends Model>(this: new () => T, id: number | string, data: Partial<T>): Promise<T | null>;
    static delete<T extends Model>(this: new () => T, id: number | string): Promise<void>;
    save(): Promise<this>;
}
