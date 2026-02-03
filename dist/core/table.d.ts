export type ColumnType = "INTEGER" | "TEXT" | "BOOLEAN";
export declare class Column<T> {
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
export declare const int: () => Column<number>;
export declare const text: () => Column<string>;
export declare const bool: () => Column<boolean>;
export interface RelationDef {
    type: "belongsTo" | "hasMany";
    table: string;
    localKey: string;
    foreignKey: string;
}
export declare class Table<Schema = any> {
    tableName: string;
    columns: Record<string, Column<any>>;
    relations: Record<string, RelationDef>;
    constructor(tableName: string, columns: Record<string, Column<any>>, relations?: Record<string, RelationDef>);
    toSQL(): string;
}
export type Infer<T> = T extends Table<infer S> ? S : never;
export declare function table<T extends Record<string, Column<any>>>(name: string, columns: T, relations?: Record<string, RelationDef>): Table<{
    [K in keyof T]: T[K] extends Column<infer U> ? U : never;
}>;
