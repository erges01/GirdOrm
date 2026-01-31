# 📘 GirdORM Documentation

**Version:** 1.0.0
**Author:** Adesope
**Engine:** SQLite (via `better-sqlite3`)

---

## 🏗 Architecture Overview

You didn't just write a script; you built a layered software architecture. Here is how the pieces fit together:

1. **The Schema Layer (`src/schema/*`):** You define your data structure using TypeScript code (not SQL).
2. **The CLI Layer (`bin/gird.ts`):** This tool reads your schema files, compares them to the actual SQLite database, and automatically issues `CREATE TABLE` or `ALTER TABLE` commands.
3. **The Core Layer (`src/core/*`):**
* **`Table`:** Defines the shape of data.
* **`Builder`:** Translates your JavaScript method calls (`.where()`) into raw SQL strings.
* **`Model`:** The bridge. It takes a `Table`, runs queries via the `Builder`, and returns typed objects.


4. **The Type Layer:** Uses TypeScript Generics to ensure that `User.get()` returns a `User` object, not `any`.

---

## 1. Schema Definition

GirdORM uses a "Code-First" approach. You define tables as TypeScript objects.

### Supported Types

Currently, GirdORM supports 3 primitives which map to SQLite types:

| Gird Type | TypeScript Type | SQLite Type |
| --- | --- | --- |
| `int()` | `number` | `INTEGER` |
| `text()` | `string` | `TEXT` |
| `bool()` | `boolean` | `INTEGER` (0 or 1) |

### Defining a Table

Located in: `src/schema/`

```typescript
import { table, int, text } from "../core/table";

export const ProductTable = table("products", {
  // .primaryKey() marks this as the unique ID
  id: int().primaryKey(),
  
  name: text(),
  price: int(),
  
  // .references() creates a Foreign Key link
  ownerId: int().references("users", "id") 
});

```

---

## 2. The Migration System

Most ORMs require you to create "migration files" (e.g., `001_initial.sql`). GirdORM is **stateless**. It checks the *current* state of the database and fixes it to match your code.

### How it Works (The Logic)

1. **Load:** The CLI dynamically imports every file in `src/schema`.
2. **Check:** It asks SQLite: *"Does table X exist?"*
3. **Action:**
* If **No**: It runs `CREATE TABLE ...`
* If **Yes**: It asks *"What columns do you have?"*
* **Diff:** It compares your code columns vs. DB columns.
* **Fix:** If a column is missing, it runs `ALTER TABLE ... ADD COLUMN ...`



### Command

```bash
npx tsx bin/gird.ts migrate

```

---

## 3. Working with Data (The Model)

The `Model` class is your main interaction point. It wraps `better-sqlite3` with type safety.

### Initialization

```typescript
import { GirdDB } from "./db";
import { UserTable } from "./schema/user";

const db = new GirdDB({ dbPath: "gird.db" });
const User = db.table(UserTable); // <--- Generics apply here!

```

### Creating Records

**Method:** `create(data: Partial<T>)`

GirdORM automatically sanitizes inputs. You cannot SQL Inject this function.

```typescript
User.create({
  name: "Tunde",
  isAdmin: true // Automatically converted to 1 for SQLite
});

```

### Fetching Records

**Method:** `get(id: string | number)`

```typescript
const user = User.get(1); 
// Returns: { id: 1, name: "Tunde", ... } or null

```

### Filtering Records

**Method:** `find(conditions: Partial<T>)`

```typescript
const admins = User.find({ isAdmin: true });
// Returns an array: [{...}, {...}]

```

---

## 4. Relationships & Joins (The Advanced Stuff)

This is the most complex feature in GirdORM. It allows you to "hydrate" nested data.

### The "With" Syntax

When you request `{ with: "tableName" }`, GirdORM performs a `LEFT JOIN`.

```typescript
const post = Post.get(1, { with: "users" });

```

### How "Hydration" Works

A SQL Join returns a "flat" row like this:

```
id | title | users_id | users_name | users_email
1  | Hello | 55       | Tunde      | tunde@mail.com

```

The `Model.hydrate()` method scans this row. It sees columns starting with `users_`, strips the prefix, and builds a nested object:

```javascript
{
  id: 1,
  title: "Hello",
  users: {       // <--- Nested Object Created
    id: 55,
    name: "Tunde",
    email: "tunde@mail.com"
  }
}

```

---

## 5. Type Safety (Under the Hood)

You might be wondering: *"How does VS Code know that `User.get()` returns an object with an `email` property?"*

We use a TypeScript technique called **Type Inference**.

1. **The Column:** When you write `text()`, it returns a class `Column<string>`.
2. **The Table:** The `table()` function captures these types into a definition:
```typescript
{ name: Column<string>, age: Column<number> }

```


3. **The Inference:** We use a helper type `Infer<T>` that loops through that definition and flips it:
```typescript
{ name: string, age: number }

```


4. **The Result:** The `Model` class receives this final shape.

---

## 6. Error Codes

| Code | Meaning | Fix |
| --- | --- | --- |
| `SQLITE_CONSTRAINT_FOREIGNKEY` | You tried to link to a record that doesn't exist (e.g., Post for non-existent User). | Ensure the `authorId` exists in the `users` table first. |
| `SQLITE_ERROR` | Syntax error in SQL generation. | Check your `builder.ts` logic. |
| `TypeError: Bind parameters...` | You tried to save a Boolean/Object directly. | GirdORM usually fixes Booleans, but Objects need to be `JSON.stringify`'d manually. |

---

## 7. Future Roadmap

Features you could build next to make GirdORM version 2.0:

* [ ] **Delete:** `User.delete(1)`
* [ ] **Update:** `User.update(1, { name: "New Name" })`
* [ ] **One-to-Many:** `User.get(1, { with: "posts" })` (Get all posts for a user).