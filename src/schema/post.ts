import { table, int, text, Infer } from "../core/table";

export const PostTable = table(
  "posts",
  {
    // Columns
    id: int().primaryKey(),
    title: text(),
    content: text(),
    authorid: int().references("users", "id")
  },
  // Relations (This was missing!)
  {
    users: {
      type: "belongsTo",     // Type of relation
      table: "users",        // Target table
      localKey: "authorid",  // The column in *this* table (posts.authorid)
      foreignKey: "id"       // The column in the *target* table (users.id)
    }
  }
);

// Add the type definition so TypeScript knows 'users' might exist on a Post
export type Post = Infer<typeof PostTable> & { users?: any };