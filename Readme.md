# ⚡ GirdORM

**The TypeScript ORM for SQLite.**

GirdORM is a lightweight, type-safe Object-Relational Mapper (ORM) built from scratch. It was designed to rival tools like Prisma by offering **Zero-Config Migrations**, **Strict Type Inference**, and **Automatic Relationships** without the bloat.

## 🚀 Why GirdORM?

* **Zero-Config Migrations:** No `.sql` files. No manual migration history. Just run `migrate` and the database updates itself.
* **Strict Type Safety:** If you define a column as `int()`, TypeScript *knows* it's a number. No `any` types allowed.
* **Auto-Relations:** Fetch a Post and its Author in a single query using `{ with: "users" }`.
* **SQLite Native:** Optimized for `better-sqlite3` for maximum speed.
* **Sanitization:** Automatically handles SQLite quirks (like converting `true` -> `1`).

---

## 📦 Installation

```bash
npm install better-sqlite3 commander
npm install -D typescript tsx @types/node @types/better-sqlite3

```

## 🛠 Quick Start

### 1. Initialize

Generate the configuration file.

```bash
npx tsx bin/gird.ts init

```

### 2. Define Your Schema

Create your tables in `src/schema/`. GirdORM uses "Schema-as-Code".

**`src/schema/user.ts`**

```typescript
import { table, int, text, bool } from "../core/table";

export const UserTable = table("users", {
  id: int().primaryKey(),
  name: text(),
  email: text(),
  isAdmin: bool()
});

```

**`src/schema/post.ts`**

```typescript
import { table, int, text } from "../core/table";

export const PostTable = table("posts", {
  id: int().primaryKey(),
  title: text(),
  content: text(),
  // Automatically links to the 'users' table
  authorId: int().references("users", "id") 
});

```

### 3. The Magic Migration

Sync your database. This command scans your folder, compares it to the SQLite file, and **auto-fixes** missing tables or columns.

```bash
npx tsx bin/gird.ts migrate

```

---

## 💻 Usage

GirdORM provides a fluent API that feels like magic.

### Basic CRUD

```typescript
import { GirdDB } from "./db";
import { UserTable } from "./schema/user";

const db = new GirdDB({ dbPath: "gird.db" });
const User = db.table(UserTable);

// 1. Create (Type-Safe!)
// TypeScript will error if you misspell 'email'
User.create({
  name: "Adesope",
  email: "dev@funaab.edu.ng",
  isAdmin: true
});

// 2. Read
const user = User.get(1);
console.log(user.name); // "Adesope"

```

### Relationships (The "Join" Magic)

Fetch related data in one shot. No need for multiple queries.

```typescript
import { PostTable } from "./schema/post";
const Post = db.table(PostTable);

// Fetch Post #1 AND the Author details automatically
const post = Post.get(1, { with: "users" });

console.log(post);
/* Output:
{
  id: 1,
  title: "Building GirdORM",
  authorId: 1,
  users: {
    id: 1,
    name: "Adesope",
    email: "dev@funaab.edu.ng"
  }
}
*/

```

---

## 🧠 Under the Hood

How does the **Type Inference** work?

We use a TypeScript feature called `Infer<T>`. When you define a table using our helper functions (`int()`, `text()`), we attach a "Phantom Type" to the column.

```typescript
// Inside core/table.ts
export type Infer<T> = T extends Table<infer S> ? S : never;

```

When you pass the schema to `db.table()`, we extract this inferred type and pass it to the `Model<T>` class. This is why VS Code can autocomplete your database columns!

---

## 🛡 Safety Features

1. **Foreign Key Enforcement:** If you try to create a Post for a user that doesn't exist, GirdORM throws a `SQLITE_CONSTRAINT_FOREIGNKEY` error.
2. **Boolean Sanitizer:** SQLite doesn't support booleans. GirdORM automatically converts `true` to `1` on write, and manages it on read.
3. **SQL Injection Protection:** All queries use parameterized statements (`?`) to prevent hacking.

---

## 👤 Author

Built by **Adesope** 
*Creating tools for cracked developers.*