import { DBAdapter } from "./adapter";
import "reflect-metadata";
export declare class QueryBuilder {
    private _model;
    private _tableName;
    private _columns;
    private _conditions;
    private _params;
    private _joins;
    private _groupBy;
    private _adapter?;
    private _operation;
    private _data;
    constructor(model: any, adapter?: DBAdapter);
    select(...columns: string[]): this;
    with(relationName: string): this;
    where(conditions: Record<string, any>): this;
    insert(data: Record<string, any>): this;
    update(data: Record<string, any>): this;
    delete(): this;
    toSQL(): {
        sql: string;
        params: any[];
    };
}
