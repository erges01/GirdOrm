import { table, int, text } from "../core/table";

export const PostTable = table("posts", {
  // 1. Primary Key (Auto-increments 1, 2, 3...)
  id: int().primaryKey(),
  
  title: text(),
  content: text(),

  // 2. Foreign Key (Links this post to a specific User)
  authorId: int().references("users", "id")
});