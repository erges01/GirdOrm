"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostTable = void 0;
const table_1 = require("../core/table");
exports.PostTable = (0, table_1.table)("posts", {
    // Columns
    id: (0, table_1.int)().primaryKey(),
    title: (0, table_1.text)(),
    content: (0, table_1.text)(),
    authorid: (0, table_1.int)().references("users", "id")
}, 
// Relations (This was missing!)
{
    users: {
        type: "belongsTo", // Type of relation
        table: "users", // Target table
        localKey: "authorid", // The column in *this* table (posts.authorid)
        foreignKey: "id" // The column in the *target* table (users.id)
    }
});
