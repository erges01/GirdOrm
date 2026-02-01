import "dotenv/config"; 
import { GirdDB } from "./db";
import { PostgresAdapter } from "./drivers/postgres"; 
import { UserTable } from "./schema/user";
import { PostTable } from "./schema/post";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("❌ DATABASE_URL is missing!");

const adapter = new PostgresAdapter(connectionString);
const db = new GirdDB(adapter);

const User = db.table(UserTable);
const Post = db.table(PostTable);

console.log("🚀 Starting GirdORM Playground...");

async function run() {
  await db.init();

  try {
    // --- 1. SETUP: Create Tunde ---
    let tunde;
    const users = await User.find({ email: "tunde@funaab.edu.ng" });
    
    if (users.length === 0) {
        console.log("Creating Tunde...");
        // FIX: isAdmin -> isadmin
        await User.create({ name: "Tunde", email: "tunde@funaab.edu.ng", isadmin: true });
        
        const newUsers = await User.find({ email: "tunde@funaab.edu.ng" });
        tunde = newUsers[0]!;
    } else {
        tunde = users[0]!;
    }
    
    if (!tunde || !tunde.id) {
        console.error("❌ Critical Error: Tunde was not found or has no ID.");
        return; 
    }
    console.log("👤 User Found:", tunde.name, `(ID: ${tunde.id})`);

    // --- 2. SETUP: Create Post ---
    console.log(`\n2. Creating Post...`);
    try {
        await Post.create({
            title: "Why GirdORM is cracked",
            content: "It is faster than Prisma.",
            authorid: tunde.id  // FIX: authorId -> authorid
        });
        console.log("✅ Post Created!");
    } catch (e) { console.log("   (Post might exist)"); }

    // --- 3. Ghost Test ---
    console.log("\n3. Testing Foreign Key Constraints...");
    try {
        await Post.create({
            title: "Ghost Post",
            content: "This should not exist.",
            authorid: 9999 // FIX: authorId -> authorid
        });
        console.log("❌ ERROR: The database allowed a ghost post!");
    } catch (error: any) {
        if (error.code === '23503') {
            console.log("🛡️ BLOCKED! Foreign Key check passed.");
        } else {
            console.log("❌ Unexpected Error:", error.message);
        }
    }

    // --- 4. TEST JOIN (BelongsTo) ---
    console.log("\n4. Testing JOIN (Post -> User)...");
    
    // FIX: authorId -> authorid
    const myPosts = await Post.find({ authorid: tunde.id }); 
    
    if (myPosts.length > 0) {
        const postId = myPosts[0]!.id;
        const postWithUser: any = await Post.get(postId, { with: "users" });

        if (postWithUser?.users?.name === "Tunde") {
            console.log("✅ Success: JOIN worked!");
        } else {
            console.log("❌ Failure: User not found in post.");
        }
    }

    // --- 5. TEST UPDATE ---
    console.log("\n5. Testing UPDATE...");
    console.log("   Old Name:", tunde.name);
    await User.update(tunde.id, { name: "Tunde (The Builder)" });
    const updatedTunde = (await User.get(tunde.id)) as any;
    console.log("   New Name:", updatedTunde.name);

    // --- 6. TEST DELETE ---
    console.log("\n6. Testing DELETE...");
    await Post.create({
        title: "Delete Me",
        content: "I am short lived.",
        authorid: tunde.id // FIX: authorId -> authorid
    });
    const tempPosts = await Post.find({ title: "Delete Me" });
    
    if (tempPosts.length > 0) {
        const postToDelete = tempPosts[0]!;
        console.log(`   Deleting post ID: ${postToDelete.id}`);
        await Post.delete(postToDelete.id);
        
        const check = await Post.get(postToDelete.id);
        if (!check) console.log("✅ DELETE Worked! Post is gone.");
    }

    // --- 7. TEST ADVANCED FILTERS ---
    console.log("\n7. Testing Advanced Operators...");
    try {
        // FIX: isAdmin -> isadmin
        await User.create({ name: "Junior Dev", email: "junior@funaab.edu.ng", isadmin: false });
    } catch(e) {} 

    const allUsers = await User.find({ id: { gt: 0 } } as any);
    console.log(`   > Found ${allUsers.length} users with ID > 0`);

    // --- 8. TEST ONE-TO-MANY (User -> Posts) ---
    console.log("\n8. Testing One-to-Many (Hydration)...");
    
    // Create extra post
    try {
        await Post.create({ 
            title: "Another Post", 
            content: "Stacking them up", 
            authorid: tunde.id // FIX: authorId -> authorid
        });
    } catch(e) {}

    const userWithPosts: any = await User.get(tunde.id, { with: "posts" });
    
    if (userWithPosts && Array.isArray(userWithPosts.posts) && userWithPosts.posts.length > 0) {
        console.log(`✅ Success! Tunde has ${userWithPosts.posts.length} posts.`);
        console.log("   Preview:", JSON.stringify(userWithPosts.posts[0].title));
    } else {
        console.log("❌ Failed to fetch posts.");
    }

  } catch (e) {
    console.error(e);
  } finally {
      await db.close();
  }
}

run();