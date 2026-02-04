# 🦒 GirdORM

> **The Code-First, Type-Safe ORM for Postgres.**
> *Stop writing migrations. Start writing Classes.*

**GirdORM** is a modern Object-Relational Mapper built for developers who want speed without the bloat. It was designed to rival tools like TypeORM and Prisma by offering **Class-Based Models**, **Auto-Sync Migrations**, and **Zero-Config Setup**.

## 🚀 Why GirdORM?

* **⚡ Zero-Config Migrations:** No `.sql` files to manage. GirdORM inspects your classes and syncs the database automatically at startup.
* **🏗️ Class-Based Schemas:** Define your database tables using standard TypeScript classes and decorators.
* **🔗 Auto-Relations:** Use `@HasMany` and `@BelongsTo` to link tables instantly.
* **🐘 Postgres Native:** Built specifically for the power and reliability of PostgreSQL.
* **🛡️ Type-Safety:** Full TypeScript support for queries and returns.

---

## 📦 Installation

```bash
npm install girdorm pg reflect-metadata dotenv

```

*(Note: You also need `tsx` or `ts-node` to run your TypeScript files)*

---

## 🛠 Quick Start

### 1. Initialize Project

Run the magic command to set up your folder structure and configuration:

```bash
npx gird init

```

*This creates `src/schema/`, `gird.json`, and generates a `.env` file.*

### 2. Generate a Model

Create a new database table definition in seconds:

```bash
npx gird make:model User

```

This automatically creates `src/schema/User.ts`:

```typescript
import { Model, Column } from 'girdorm';

export class User extends Model {
  // 1. Define Table Name
  static tableName = "users";

  // 2. Define Columns
  @Column({ type: 'int', primary: true, generated: true })
  id!: number;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'text' })
  email!: string;
}

```

### 3. Run It

Connect your models in your main entry file (e.g., `src/main.ts`):

```typescript
import "reflect-metadata"; // Required at top
import "dotenv/config";
import { GirdDB, PostgresAdapter } from "girdorm";
import { User } from "./schema/User";

async function main() {
  // 1. Connect
  const db = new GirdDB(new PostgresAdapter(process.env.DATABASE_URL));

  // 2. Register Models (Crucial Step!)
  db.register([ User ]);

  // 3. Sync Database (Auto-creates tables)
  await db.init(); 

  // 4. Use It!
  const user = await User.create({ 
    name: "Adesope", 
    email: "dev@gird.com" 
  });
  
  console.log(`Created User: ${user.name} with ID: ${user.id}`);
}

main();

```

---

## 💻 Usage & API

### Defining Relations

GirdORM handles complex joins with simple decorators.

**The User (Parent):**

```typescript
import { HasMany } from 'girdorm';
import { Post } from './Post';

export class User extends Model {
  // ... columns ...

  @HasMany(() => Post, "authorid")
  posts?: Post[];
}

```

**The Post (Child):**

```typescript
import { BelongsTo } from 'girdorm';
import { User } from './User';

export class Post extends Model {
  @Column({ type: 'int' })
  authorid!: number;

  @BelongsTo(() => User, "authorid")
  author?: User;
}

```

### Querying with Relations (Magic Joins)

Fetch a User and all their Posts in a single, efficient query.

```typescript
const user = await User.get(1, { with: "posts" });

console.log(user.posts); 
// Output: [{ id: 1, title: "GirdORM is Live", authorid: 1 }]

```

### Transactions

Perform atomic operations safely.

```typescript
await db.transaction(async (tx) => {
  await User.create({ name: "Alice" });
  await User.create({ name: "Bob" });
  // If anything fails here, BOTH creates are rolled back.
});

```

---

## 🧠 Under the Hood

**How does the Magic work?**

GirdORM uses TypeScript **Decorators** and `Reflect Metadata`.

1. When you add `@Column()`, we store metadata about that property on the class prototype.
2. When you call `db.register([User])`, we read that metadata.
3. The **Migrator** compares your Class Metadata against the actual Postgres `information_schema`.
4. If a table or column is missing, GirdORM generates the raw SQL (`CREATE TABLE...` or `ALTER TABLE...`) to fix it instantly.

---

## 👤 Author

**Adesope** *Building tools for cracked developers.*