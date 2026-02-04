"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Column = Column;
exports.HasMany = HasMany;
exports.BelongsTo = BelongsTo;
require("reflect-metadata");
function Column(options) {
    return function (target, propertyKey) {
        const columns = Reflect.getMetadata("gird:columns", target.constructor) || [];
        columns.push({
            name: propertyKey,
            options: options
        });
        Reflect.defineMetadata("gird:columns", columns, target.constructor);
    };
}
// --- 2. RELATION DEFINITIONS (The New Stuff!) ---
/**
 * Defines a One-to-Many relationship (e.g. User has many Posts).
 * @param modelFunc A function returning the related class (e.g. () => Post)
 * @param foreignKey The column name in the OTHER table (e.g. "authorid")
 */
function HasMany(modelFunc, foreignKey) {
    return function (target, propertyKey) {
        const relations = Reflect.getMetadata("gird:relations", target.constructor) || [];
        relations.push({
            type: "hasMany",
            key: propertyKey, // The property name, e.g., "posts"
            model: modelFunc, // The related Model class
            foreignKey: foreignKey
        });
        Reflect.defineMetadata("gird:relations", relations, target.constructor);
    };
}
/**
 * Defines a Many-to-One relationship (e.g. Post belongs to User).
 * @param modelFunc A function returning the related class (e.g. () => User)
 * @param foreignKey The column name in THIS table (e.g. "authorid")
 */
function BelongsTo(modelFunc, foreignKey) {
    return function (target, propertyKey) {
        const relations = Reflect.getMetadata("gird:relations", target.constructor) || [];
        relations.push({
            type: "belongsTo",
            key: propertyKey, // The property name, e.g., "author"
            model: modelFunc,
            foreignKey: foreignKey
        });
        Reflect.defineMetadata("gird:relations", relations, target.constructor);
    };
}
