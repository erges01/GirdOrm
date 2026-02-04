"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const index_1 = require("./index");
const model_1 = require("./core/model");
// 👇 IMPORT THE NEW DECORATORS
const decorators_1 = require("./core/decorators");
// --- 1. DEFINE MODELS ---
class User extends model_1.Model {
}
User.tableName = "users";
__decorate([
    (0, decorators_1.Column)({ type: "int", primary: true, generated: true }),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, decorators_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, decorators_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, decorators_1.Column)({ type: "boolean" }),
    __metadata("design:type", Boolean)
], User.prototype, "isadmin", void 0);
__decorate([
    (0, decorators_1.HasMany)(() => Post, "authorid"),
    __metadata("design:type", Array)
], User.prototype, "posts", void 0);
class Post extends model_1.Model {
}
Post.tableName = "posts";
__decorate([
    (0, decorators_1.Column)({ type: "int", primary: true, generated: true }),
    __metadata("design:type", Number)
], Post.prototype, "id", void 0);
__decorate([
    (0, decorators_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Post.prototype, "title", void 0);
__decorate([
    (0, decorators_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Post.prototype, "content", void 0);
__decorate([
    (0, decorators_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], Post.prototype, "authorid", void 0);
__decorate([
    (0, decorators_1.BelongsTo)(() => User, "authorid"),
    __metadata("design:type", User)
], Post.prototype, "author", void 0);
// --- 2. THE PLAYGROUND ---
console.log("🚀 Starting GirdORM Playground...");
async function run() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString)
        throw new Error("❌ DATABASE_URL is missing!");
    const adapter = new index_1.PostgresAdapter(connectionString);
    const db = new index_1.GirdDB(adapter);
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
        }
        else {
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
        }
        catch (e) {
            console.log("   (Post might exist)");
        }
        // --- TEST 3: Ghost Test ---
        console.log("\n3. Testing Foreign Key Constraints...");
        try {
            await Post.create({
                title: "Ghost Post",
                content: "This should not exist.",
                authorid: 9999
            });
            console.log("❌ ERROR: The database allowed a ghost post!");
        }
        catch (error) {
            if (error.code === '23503') {
                console.log("🛡️ BLOCKED! Foreign Key check passed.");
            }
            else {
                console.log("❌ Unexpected Error:", error.message);
            }
        }
        // --- TEST 4: MAGIC JOIN (The Cracked Feature 🪄) ---
        console.log("\n4. Testing Magic Join (with: 'posts')...");
        // 👇 The "Junior Dev" way is gone. We use the ORM way now.
        const userWithPosts = await User.get(tunde.id, { with: "posts" });
        if (userWithPosts && userWithPosts.posts && userWithPosts.posts.length > 0) {
            console.log(`✅ Success! Tunde has ${userWithPosts.posts.length} posts.`);
            console.log(`   Sample: "${userWithPosts.posts[0].title}"`);
        }
        else {
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
    }
    catch (e) {
        console.error(e);
    }
    finally {
        await db.close();
    }
}
run();
