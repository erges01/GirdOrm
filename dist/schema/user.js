"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserTable = void 0;
const table_1 = require("../core/table");
exports.UserTable = (0, table_1.table)("users", {
    // Columns
    id: (0, table_1.int)().primaryKey(),
    name: (0, table_1.text)(),
    email: (0, table_1.text)(),
    isadmin: (0, table_1.bool)(), // CHANGED: isAdmin -> isadmin (lowercase)
}, 
// Relations (The New Part)
{
    posts: {
        type: "hasMany", // One User -> Many Posts
        table: "posts", // Target table
        localKey: "id", // My ID (users.id)
        foreignKey: "authorid" // CHANGED: authorId -> authorid (lowercase)
    }
});
