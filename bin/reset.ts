import "dotenv/config";
import { PostgresAdapter } from "../src/drivers/postgres";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("Missing DATABASE_URL");

const adapter = new PostgresAdapter(connectionString);

async function reset() {
  console.log("🔥 Dropping old tables...");
  
  // We drop 'posts' first because it depends on 'users'
  try {
    // FIX: Pass empty array [] as the second argument
    await adapter.query(`DROP TABLE IF EXISTS "posts";`, []);
    await adapter.query(`DROP TABLE IF EXISTS "users";`, []);
    console.log("✅ Tables dropped.");
  } catch (e) {
    console.error("❌ Error dropping tables:", e);
  } finally {
    // FIX: Ensure close exists (it should if you updated postgres.ts correctly)
    if (adapter.close) {
        await adapter.close();
    }
  }
}

reset();