import "dotenv/config"; // Load environment variables
import { GirdDB } from "./db";
import { PostgresAdapter } from "./drivers/postgres"; 
import { UserTable } from "./schema/user";
import { PostTable } from "./schema/post";

// 1. Get URL from .env (Secure!)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("❌ DATABASE_URL is missing from .env file!");
}

// 2. Initialize
const adapter = new PostgresAdapter(connectionString);
const db = new GirdDB(adapter);

const User = db.table(UserTable);
const Post = db.table(PostTable);

console.log("🚀 Starting GirdORM Playground...");

async function run() {
  await db.init();

  try {
    // --- 1. Create User ---
    console.log("\n1. Creating User...");
    try {
        await User.create({
            name: "Tunde",
            email: "tunde@funaab.edu.ng",
            isAdmin: true
        });
        console.log("✅ User 'Tunde' created.");
    } catch (e) { 
        console.log("   (User might already exist)"); 
    }
    
    // --- FETCH USER (The Fix) ---
    const users = await User.find({ email: "tunde@funaab.edu.ng" });
    
    // 🛑 THE FIX: Add '!' here once. 
    // This forces TypeScript to accept that the user exists.
    const tunde = users[0]!; 

    if (!tunde) {
        throw new Error("CRITICAL: User not found!");
    }
    console.log("👤 User Found:", tunde);

    // --- 2. Create Post ---
    // Now we don't need '!' anymore because 'tunde' is already safe
    console.log(`\n2. Creating Post for Tunde (ID: ${tunde.id})...`);
    
    try {
        await Post.create({
            title: "Why GirdORM is cracked",
            content: "It is faster than Prisma.",
            authorId: tunde.id 
        });
        console.log("✅ Post Created!");
    } catch (e) { 
        console.log("   (Post might already exist)"); 
    }

    // --- 3. Ghost Test ---
    console.log("\n3. Testing Foreign Key Constraints...");
    try {
        await Post.create({
            title: "Ghost Post",
            content: "This should not exist.",
            authorId: 9999
        });
        console.log("❌ ERROR: The database allowed a ghost post!");
    } catch (error: any) {
        if (error.code === '23503') {
            console.log("🛡️ BLOCKED! Foreign Key check passed.");
        } else {
            console.log("❌ Unexpected Error:", error.message);
        }
    }

    // --- 4. JOIN Test ---
    console.log("\n4. Testing JOIN...");
    
    const myPosts = await Post.find({ authorId: tunde.id });
    
    if (myPosts.length > 0) {
        const postId = myPosts[0].id;
        const postWithUser: any = await Post.get(postId, { with: "users" });

        console.log("\n📦 RESULT FROM DB:");
        console.log(JSON.stringify(postWithUser, null, 2));

        if (postWithUser?.users?.name === "Tunde") {
            console.log("\n🎉 SUCCESS: JOIN worked!");
        } else {
            console.log("\n❌ FAILURE: User not found in post.");
        }
    } else {
        console.log("⚠️ No posts found for Tunde.");
    }

  } catch (e) {
    console.error(e);
  } finally {
      await db.close();
  }
}

run();