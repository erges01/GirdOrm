import { DBAdapter } from "./core/adapter";
import { Model } from "./core/model";
import { Migrator } from "./core/migrate";
import { PostgresAdapter, TransactionAdapter } from "./drivers/postgres";

export class GirdDB {
  public readonly adapter: DBAdapter;
  // 👇 NEW: We store the models here so Migrator can find them
  public models: (typeof Model)[] = [];

  constructor(adapter: DBAdapter) {
    this.adapter = adapter;
  }

  // 1. Init: Run Migrations using the REGISTERED models (not file scanning)
  async init() {
    if (this.adapter instanceof PostgresAdapter) {
      // 👇 CHANGED: Pass 'this' instead of a file path
      const migrator = new Migrator(this);
      await migrator.sync();
    }
  }

  // 2. Register Models
  register(models: (typeof Model)[]) {
    // 👇 NEW: Save them to memory
    this.models = models;

    for (const model of models) {
      model.adapter = this.adapter;
      
      if (!model.tableName) {
        model.tableName = model.name;
      }
    }
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
    if (this.adapter.close) {
      await this.adapter.close();
    }
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