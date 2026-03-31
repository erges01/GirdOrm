/** @deprecated Use the \`@Column\` decorator on a class that extends \`Model\` instead. */
export type ColumnType = "INTEGER" | "TEXT" | "BOOLEAN";
/**
 * @deprecated Use the \`@Column\` decorator on a class that extends \`Model\` instead.
 *
 * <T> is a "Phantom Type" that tells TypeScript what kind of data this column holds.
 * RENAMED from 'Column' to 'DbColumn' to avoid conflict with the @Column decorator.
 */
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
/** @deprecated Use \`@Column({ type: "int" })\` on a Model class instead. */
export declare const int: () => DbColumn<number>;
/** @deprecated Use \`@Column({ type: "text" })\` on a Model class instead. */
export declare const text: () => DbColumn<string>;
/** @deprecated Use \`@Column({ type: "boolean" })\` on a Model class instead. */
export declare const bool: () => DbColumn<boolean>;
/** @deprecated Use \`@HasMany\` / \`@BelongsTo\` decorators on a Model class instead. */
export interface RelationDef {
    type: "belongsTo" | "hasMany";
    table: string;
    localKey: string;
    foreignKey: string;
}
/** @deprecated Use a class that extends \`Model\` with \`@Column\` decorators instead. */
export declare class Table<Schema = any> {
    tableName: string;
    columns: Record<string, DbColumn<any>>;
    relations: Record<string, RelationDef>;
    constructor(tableName: string, columns: Record<string, DbColumn<any>>, // Updated type
    relations?: Record<string, RelationDef>);
    toSQL(): string;
}
/** @deprecated Infer types from a Model subclass instead. */
export type Infer<T> = T extends Table<infer S> ? S : never;
/** @deprecated Define your schema as a class extending \`Model\` instead. */
export declare function table<T extends Record<string, DbColumn<any>>>(name: string, columns: T, relations?: Record<string, RelationDef>): Table<{
    [K in keyof T]: T[K] extends DbColumn<infer U> ? U : never;
}>;
