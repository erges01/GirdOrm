import { table, int, text, bool, Infer } from "../core/table";

export const UserTable = table(
  "users",
  {
    // Columns
    id: int().primaryKey(),
    name: text(),
    email: text(),
    isadmin: bool(), // CHANGED: isAdmin -> isadmin (lowercase)
  },
  // Relations (The New Part)
  {
    posts: {
      type: "hasMany",       // One User -> Many Posts
      table: "posts",        // Target table
      localKey: "id",        // My ID (users.id)
      foreignKey: "authorid" // CHANGED: authorId -> authorid (lowercase)
    }
  }
);

// We manually add { posts?: any[] } because relations are dynamic
export type User = Infer<typeof UserTable> & { posts?: any[] };