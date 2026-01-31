import { table, int, text, bool } from "../core/table";

export const UserTable = table("users", {
  // Update ID to be a Primary Key
  id: int().primaryKey(),
  
  name: text(),
  email: text(),
  isAdmin: bool()
});