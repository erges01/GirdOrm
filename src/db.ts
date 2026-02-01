import { DBAdapter } from "./core/adapter";
import { Table, Infer } from "./core/table";
import { Model } from "./core/model";
import { Migrator } from "./core/migrate";
import { PostgresAdapter, TransactionAdapter } from "./drivers/postgres";

export class GirdDB {
  // 👇 FIX: Changed from 'private' to 'public readonly'
  // This allows outside code to use db.adapter!
  public readonly adapter: DBAdapter;

  constructor(adapter: DBAdapter) {
    this.adapter = adapter;
  }

  // 1. Init: Run Migrations automatically if using Postgres
  async init() {
    if (this.adapter instanceof PostgresAdapter) {
      const migrator = new Migrator(this, "./src/schema");
      await migrator.sync();
    }
  }

  // 2. Define a Model
  table<T extends Table>(schema: T) {
    return new Model<Infer<T>>(this.adapter, schema);
  }

  // Helper A: Run command (Insert/Create)
  async execute(sql: string, params: any[] = []) {
    return await this.adapter.query(sql, params);
  }

  // Helper B: Run query (Select)
  async queryRaw(sql: string, params: any[] = []) {
    return await this.adapter.query(sql, params);
  }

  // 3. Close Connection
  async close() {
    await this.adapter.close();
  }

  // --- 4. Transaction Support ---
  async transaction(callback: (tx: GirdDB) => Promise<void>) {
    if (!(this.adapter instanceof PostgresAdapter)) {
      throw new Error("Transactions are only supported on the main PostgresAdapter.");
    }

    console.log("🔒 Starting Transaction...");
    const client = await this.adapter.getClient();

    try {
      await client.query("BEGIN");

      // Create a 'Clone' of GirdDB using the locked client
      const txAdapter = new TransactionAdapter(client);
      const txDB = new GirdDB(txAdapter);

      await callback(txDB);

      await client.query("COMMIT");
      console.log("🔓 Transaction Committed.");

    } catch (e) {
      await client.query("ROLLBACK");
      console.error("🛑 Transaction Failed! Rolling back changes.");
      throw e;
    } finally {
      client.release();
    }
  }
}