import { GirdDB } from "../db";
import "reflect-metadata";

// ---------------------------------------------------------------------------
// Type mapping
// Maps the shorthand types used in @Column({ type: "..." }) to real
// PostgreSQL type names used in DDL statements.
// ---------------------------------------------------------------------------

const TYPE_MAP: Record<string, string> = {
  // Integer family
  int: "INTEGER",
  integer: "INTEGER",
  bigint: "BIGINT",
  smallint: "SMALLINT",
  serial: "SERIAL",

  // Floating point
  float: "REAL",
  real: "REAL",
  double: "DOUBLE PRECISION",
  numeric: "NUMERIC",
  decimal: "DECIMAL",

  // Text family
  text: "TEXT",
  varchar: "VARCHAR",
  char: "CHAR",

  // Boolean
  bool: "BOOLEAN",
  boolean: "BOOLEAN",

  // Date / time
  date: "DATE",
  time: "TIME",
  timestamp: "TIMESTAMP",
  timestamptz: "TIMESTAMPTZ",

  // JSON
  json: "JSON",
  jsonb: "JSONB",

  // Other
  uuid: "UUID",
  bytea: "BYTEA",
};

function mapType(raw: string): string {
  return TYPE_MAP[raw.toLowerCase()] ?? raw.toUpperCase();
}

// ---------------------------------------------------------------------------
// Migrator
// ---------------------------------------------------------------------------

export class Migrator {
  private db: GirdDB;

  constructor(db: GirdDB) {
    this.db = db;
  }

  async sync() {
    console.log("🔄 Syncing database schema...\n");

    const models = this.db.models;

    if (!models || models.length === 0) {
      console.warn(
        "⚠️  No models registered. Did you call db.register([...models])?",
      );
      return;
    }

    for (const model of models) {
      const tableName: string = (model as any).tableName;

      if (!tableName) {
        console.warn(`⚠️  Skipping model with no tableName.`);
        continue;
      }

      // Read column metadata written by @Column decorators
      const columns: any[] = Reflect.getMetadata("gird:columns", model) ?? [];

      if (columns.length === 0) {
        console.warn(
          `⚠️  Skipping "${tableName}": No @Column definitions found.`,
        );
        continue;
      }

      // ------------------------------------------------------------------
      // STEP 1 — CREATE TABLE IF NOT EXISTS
      // Handles first-time setup. Safe to re-run on every boot.
      // ------------------------------------------------------------------

      const colDefs = columns.map((col: any) => {
        const pgType = mapType(col.options.type);
        let def = `"${col.name}" ${pgType}`;

        if (col.options.primary) def += " PRIMARY KEY";
        if (col.options.generated) def += " GENERATED ALWAYS AS IDENTITY";

        // Only add NOT NULL when the column is neither nullable, generated,
        // nor the primary key (PKs carry their own implicit NOT NULL).
        if (
          !col.options.nullable &&
          !col.options.generated &&
          !col.options.primary
        ) {
          def += " NOT NULL";
        }

        return def;
      });

      const createSQL = `CREATE TABLE IF NOT EXISTS "${tableName}" (${colDefs.join(", ")});`;

      try {
        await this.db.adapter.query(createSQL);
        console.log(`  ✅ Table ready:  "${tableName}"`);
      } catch (err: any) {
        console.error(`  ❌ Failed to create "${tableName}": ${err.message}`);
        // If the table couldn't be created / verified, skip the ALTER step
        // to avoid cascading errors.
        continue;
      }

      // ------------------------------------------------------------------
      // STEP 2 — ALTER TABLE … ADD COLUMN IF NOT EXISTS
      // Detects columns that exist in the model but not yet in the database.
      // This handles the common case of adding a new field to an existing model.
      // ------------------------------------------------------------------

      let existingColNames: string[] = [];

      try {
        const rows = await this.db.adapter.query<{ column_name: string }>(
          `SELECT column_name
           FROM   information_schema.columns
           WHERE  table_name   = $1
           AND    table_schema = 'public';`,
          [tableName],
        );
        existingColNames = rows.map((r) => r.column_name.toLowerCase());
      } catch (err: any) {
        console.error(
          `  ⚠️  Could not read existing columns for "${tableName}": ${err.message}`,
        );
        // Non-fatal — skip the ALTER step for this model.
        continue;
      }

      let addedAny = false;

      for (const col of columns) {
        if (existingColNames.includes(col.name.toLowerCase())) {
          // Column already exists — nothing to do.
          continue;
        }

        // Build the ALTER TABLE statement.
        // New columns on existing tables must be nullable (or have a DEFAULT)
        // because existing rows would otherwise violate the NOT NULL constraint.
        const pgType = mapType(col.options.type);
        let alterDef = `"${col.name}" ${pgType}`;

        // If the user explicitly declared the column as nullable, honour that.
        // Otherwise, default to NULL so the migration never fails on tables
        // that already contain rows. The developer can add the constraint
        // manually once they have backfilled the data.
        alterDef += col.options.nullable ? " DEFAULT NULL" : " DEFAULT NULL";

        const alterSQL = `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS ${alterDef};`;

        try {
          await this.db.adapter.query(alterSQL);
          console.log(
            `  ➕ Added column:  "${tableName}"."${col.name}" (${pgType})`,
          );
          addedAny = true;
        } catch (err: any) {
          console.error(
            `  ❌ Failed to add column "${col.name}" to "${tableName}": ${err.message}`,
          );
        }
      }

      if (!addedAny && existingColNames.length > 0) {
        console.log(`     No new columns for "${tableName}".`);
      }
    }

    console.log("\n✅ Database sync complete.\n");
  }
}
