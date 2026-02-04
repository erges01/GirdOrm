import "reflect-metadata";
export interface ColumnOptions {
    type: string;
    primary?: boolean;
    generated?: boolean;
    nullable?: boolean;
}
export declare function Column(options: ColumnOptions): (target: any, propertyKey: string) => void;
/**
 * Defines a One-to-Many relationship (e.g. User has many Posts).
 * @param modelFunc A function returning the related class (e.g. () => Post)
 * @param foreignKey The column name in the OTHER table (e.g. "authorid")
 */
export declare function HasMany(modelFunc: () => any, foreignKey: string): (target: any, propertyKey: string) => void;
/**
 * Defines a Many-to-One relationship (e.g. Post belongs to User).
 * @param modelFunc A function returning the related class (e.g. () => User)
 * @param foreignKey The column name in THIS table (e.g. "authorid")
 */
export declare function BelongsTo(modelFunc: () => any, foreignKey: string): (target: any, propertyKey: string) => void;
