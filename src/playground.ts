import "dotenv/config"; 
import { GirdDB, PostgresAdapter } from "./index";
import { Model } from "./core/model";
// 👇 IMPORT THE NEW DECORATORS
import { Column, HasMany, BelongsTo } from "./core/decorators";

// --- 1. DEFINE MODELS ---

class User extends Model {
  static tableName = "users"; 

  @Column({ type: "int", primary: true, generated: true })
  id!: number;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "text" })
  email!: string;

  @Column({ type: "boolean" })
  isadmin!: boolean; 

  // 👇 NEW: Define the Relationship
  // "User has many Posts" (Post table uses 'authorid' to point to us)
  @HasMany(() => Post, "authorid")
  posts?: Post[];
}

class Post extends Model {
  static tableName = "posts";

  @Column({ type: "int", primary: true, generated: true })
  id!: number;

  @Column({ type: "text" })
  title!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "int" })
  authorid!: number; 
  
  // 👇 NEW: Define the Inverse Relationship
  // "Post belongs to User" (We use 'authorid' to point to them)
  @BelongsTo(() => User, "authorid")
  author?: User;
}

// --- 2. THE PLAYGROUND ---
console.log("🚀 Starting GirdORM Playground...");

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("❌ DATABASE_URL is missing!");

  const adapter = new PostgresAdapter(connectionString);
  const db = new GirdDB(adapter);

  db.register([User, Post]);

  await db.init(); 

  try {
    // --- TEST 1: Create/Find Tunde ---
    let tunde;
    const users = await User.find({ email: "tunde@funaab.edu.ng" });
    
    if (users.length === 0) {
        console.log("Creating Tunde...");
        tunde = await User.create({ 
            name: "Tunde", 
            email: "tunde@funaab.edu.ng", 
            isadmin: true 
        });
    } else {
        tunde = users[0];
    }
    
    console.log("👤 User Found:", tunde.name, `(ID: ${tunde.id})`);

    // --- TEST 2: Create Post ---
    console.log(`\n2. Creating Post...`);
    try {
        await Post.create({
            title: "Why GirdORM is cracked",
            content: "It is faster than Prisma.",
            authorid: tunde.id 
        });
        console.log("✅ Post Created!");
    } catch (e) { console.log("   (Post might exist)"); }

    // --- TEST 3: Ghost Test ---
    console.log("\n3. Testing Foreign Key Constraints...");
    try {
        await Post.create({
            title: "Ghost Post",
            content: "This should not exist.",
            authorid: 9999 
        });
        console.log("❌ ERROR: The database allowed a ghost post!");
    } catch (error: any) {
        if (error.code === '23503') {
            console.log("🛡️ BLOCKED! Foreign Key check passed.");
        } else {
            console.log("❌ Unexpected Error:", error.message);
        }
    }

    // --- TEST 4: MAGIC JOIN (The Cracked Feature 🪄) ---
    console.log("\n4. Testing Magic Join (with: 'posts')...");
    
    // 👇 The "Junior Dev" way is gone. We use the ORM way now.
    const userWithPosts: any = await User.get(tunde.id, { with: "posts" });

    if (userWithPosts && userWithPosts.posts && userWithPosts.posts.length > 0) {
        console.log(`✅ Success! Tunde has ${userWithPosts.posts.length} posts.`);
        console.log(`   Sample: "${userWithPosts.posts[0].title}"`);
    } else {
        console.log("❌ Failed to load relations.");
    }

    // --- TEST 5: UPDATE (Static Method) ---
    console.log("\n5. Testing UPDATE...");
    console.log("   Old Name:", tunde.name);
    
    // 👇 NEW: No more raw SQL!
    await User.update(tunde.id, { name: "Tunde (The Builder)" });
    
    const updatedUser = await User.get(tunde.id);
    console.log("   ✅ Name Updated to:", updatedUser?.name);

    // --- TEST 6: DELETE (Static Method) ---
    console.log("\n6. Testing DELETE...");
    const tempPost = await Post.create({
        title: "Delete Me",
        content: "I am short lived.",
        authorid: tunde.id 
    });
    
    console.log(`   Deleting post ID: ${tempPost.id}`);
    
    // 👇 NEW: No more raw SQL!
    await Post.delete(tempPost.id);
    console.log("   ✅ DELETE Worked!");

  } catch (e) {
    console.error(e);
  } finally {
      await db.close();
  }
}

run();