import { describe, it, expect, beforeAll, afterAll } from "vitest"; // Or 'jest'
import { GirdDB } from "../src/db";
import { SQLiteAdapter } from "../src/drivers/sqlite";
import { table, text } from "../src/core/table";

const TestTable = table("test_users", {
    name: text()
});

describe("GirdORM", () => {
    let db: GirdDB;

    beforeAll(async () => {
        // Fix: Use Adapter Pattern
        const adapter = new SQLiteAdapter(":memory:"); // Use in-memory DB for tests
        db = new GirdDB(adapter);
        await db.init();
        
        // Manually create table for test
        await db.execute(TestTable.toSQL());
    });

    afterAll(async () => {
        await db.close();
    });

    it("should create and fetch a user", async () => {
        const User = db.table(TestTable);
        
        await User.create({ name: "Tester" });
        const user = await User.get(1);
        
        expect(user).toBeDefined();
        expect(user?.name).toBe("Tester");
    });
});