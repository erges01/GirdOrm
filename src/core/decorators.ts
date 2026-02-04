import "reflect-metadata"; 

// --- 1. COLUMN DEFINITIONS ---
export interface ColumnOptions {
  type: string;
  primary?: boolean;
  generated?: boolean;
  nullable?: boolean;
}

export function Column(options: ColumnOptions) {
  return function (target: any, propertyKey: string) {
    const columns = (Reflect as any).getMetadata("gird:columns", target.constructor) || [];
    
    columns.push({
      name: propertyKey,
      options: options
    });

    (Reflect as any).defineMetadata("gird:columns", columns, target.constructor);
  };
}

// --- 2. RELATION DEFINITIONS (The New Stuff!) ---

/**
 * Defines a One-to-Many relationship (e.g. User has many Posts).
 * @param modelFunc A function returning the related class (e.g. () => Post)
 * @param foreignKey The column name in the OTHER table (e.g. "authorid")
 */
export function HasMany(modelFunc: () => any, foreignKey: string) {
  return function (target: any, propertyKey: string) {
    const relations = (Reflect as any).getMetadata("gird:relations", target.constructor) || [];
    
    relations.push({
      type: "hasMany",
      key: propertyKey, // The property name, e.g., "posts"
      model: modelFunc, // The related Model class
      foreignKey: foreignKey
    });

    (Reflect as any).defineMetadata("gird:relations", relations, target.constructor);
  };
}

/**
 * Defines a Many-to-One relationship (e.g. Post belongs to User).
 * @param modelFunc A function returning the related class (e.g. () => User)
 * @param foreignKey The column name in THIS table (e.g. "authorid")
 */
export function BelongsTo(modelFunc: () => any, foreignKey: string) {
  return function (target: any, propertyKey: string) {
    const relations = (Reflect as any).getMetadata("gird:relations", target.constructor) || [];
    
    relations.push({
      type: "belongsTo",
      key: propertyKey, // The property name, e.g., "author"
      model: modelFunc,
      foreignKey: foreignKey
    });

    (Reflect as any).defineMetadata("gird:relations", relations, target.constructor);
  };
}