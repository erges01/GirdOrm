import { DBAdapter } from "./adapter";
import "reflect-metadata";
export type OrderDirection = "ASC" | "DESC";
export interface OrderByClause {
    column: string;
    direction: OrderDirection;
}
export declare class QueryBuilder {
    private _model;
    private _tableName;
    private _columns;
    private _conditions;
    private _params;
    private _joins;
    private _groupBy;
    private _orderBy;
    private _limit?;
    private _offset?;
    private _adapter?;
    private _operation;
    private _data;
    constructor(model: any, adapter?: DBAdapter);
    select(...columns: string[]): this;
    with(relationName: string | string[]): this;
    private _loadRelation;
    where(conditions: Record<string, any>): this;
    /**
     * Add an ORDER BY clause.
     *
     * @example
     * .orderBy("createdAt", "DESC")
     * .orderBy("name")           // defaults to ASC
     */
    orderBy(column: string, direction?: OrderDirection): this;
    limit(n: number): this;
    offset(n: number): this;
    insert(data: Record<string, any>): this;
    update(data: Record<string, any>): this;
    delete(): this;
    toSQL(): {
        sql: string;
        params: any[];
    };
}
