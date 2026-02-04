export type ColumnType = "INTEGER" | "TEXT" | "BOOLEAN";
export declare class DbColumn<T> {
    type: ColumnType;
    isPrimaryKey: boolean;
    foreignKey?: {
        table: string;
        column: string;
    };
    constructor(type: ColumnType);
    primaryKey(): this;
    references(tableName: string, columnName?: string): this;
}
export declare const int: () => DbColumn<number>;
export declare const text: () => DbColumn<string>;
export declare const bool: () => DbColumn<boolean>;
export interface RelationDef {
    type: "belongsTo" | "hasMany";
    table: string;
    localKey: string;
    foreignKey: string;
}
export declare class Table<Schema = any> {
    tableName: string;
    columns: Record<string, DbColumn<any>>;
    relations: Record<string, RelationDef>;
    constructor(tableName: string, columns: Record<string, DbColumn<any>>, // Updated type
    relations?: Record<string, RelationDef>);
    toSQL(): string;
}
export type Infer<T> = T extends Table<infer S> ? S : never;
export declare function table<T extends Record<string, DbColumn<any>>>(name: string, columns: T, relations?: Record<string, RelationDef>): Table<{
    [K in keyof T]: T[K] extends DbColumn<infer U> ? U : never;
}>;
