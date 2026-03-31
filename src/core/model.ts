import "reflect-metadata";
import { QueryBuilder } from "./builder";
import { DBAdapter } from "./adapter";
import {
  GirdError,
  GirdMissingPrimaryKeyError,
  GirdNoAdapterError,
  GirdSaveError,
  wrapPostgresError,
} from "./errors";

// ---------------------------------------------------------------------------
// FindOptions
// ---------------------------------------------------------------------------

export interface OrderByOption {
  column: string;
  direction?: "ASC" | "DESC";
}

export interface FindOptions {
  /** Eager-load one or more relations defined with @HasMany / @BelongsTo */
  with?: string | string[];

  /** Sort results. Pass a column name string or a { column, direction } object */
  orderBy?: string | OrderByOption;

  /** Maximum number of rows to return */
  limit?: number;

  /** Number of rows to skip (for pagination) */
  offset?: number;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Applies all FindOptions (with, orderBy, limit, offset) onto a QueryBuilder.
 */
function applyOptions(q: QueryBuilder, options: FindOptions) {
  if (options.with) {
    // Support both a single string and an array of relation names
    const relations = Array.isArray(options.with)
      ? options.with
      : [options.with];
    for (const rel of relations) {
      q.with(rel);
    }
  }

  if (options.orderBy) {
    if (typeof options.orderBy === "string") {
      q.orderBy(options.orderBy);
    } else {
      q.orderBy(options.orderBy.column, options.orderBy.direction ?? "ASC");
    }
  }

  if (options.limit !== undefined) q.limit(options.limit);
  if (options.offset !== undefined) q.offset(options.offset);
}

/**
 * Wraps a plain DB-result object in a proper Model subclass instance.
 * This makes instance methods (like .save()) work on query results.
 */
function toInstance<T extends Model>(
  ctor: new () => T,
  raw: Record<string, any>,
): T {
  return Object.assign(new ctor(), raw) as T;
}

// ---------------------------------------------------------------------------
// Model base class
// ---------------------------------------------------------------------------

export class Model {
  /** Set by GirdDB.register() */
  static tableName: string;

  /** Set by GirdDB.register() */
  static adapter: DBAdapter;

  // -------------------------------------------------------------------------
  // 1. CREATE
  // -------------------------------------------------------------------------

  static async create<T extends Model>(
    this: new () => T,
    data: Partial<T>,
  ): Promise<T> {
    const model = this as any;

    if (!model.adapter) throw new GirdNoAdapterError(model.name);

    const q = new QueryBuilder(model, model.adapter).insert(
      data as Record<string, any>,
    );

    const { sql, params } = q.toSQL();

    try {
      const res = await model.adapter.query(sql, params);
      return toInstance(this, res[0]);
    } catch (err: any) {
      throw wrapPostgresError(err);
    }
  }

  // -------------------------------------------------------------------------
  // 2. GET (single row by primary key)
  // -------------------------------------------------------------------------

  static async get<T extends Model>(
    this: new () => T,
    id: number | string,
    options: FindOptions = {},
  ): Promise<T | null> {
    const model = this as any;

    if (!model.adapter) throw new GirdNoAdapterError(model.name);

    const q = new QueryBuilder(model, model.adapter).select("*").where({ id });

    applyOptions(q, options);

    const { sql, params } = q.toSQL();

    try {
      const res = await model.adapter.query(sql, params);
      return res[0] ? toInstance(this, res[0] as Record<string, any>) : null;
    } catch (err: any) {
      throw wrapPostgresError(err);
    }
  }

  // -------------------------------------------------------------------------
  // 3. FIND (multiple rows by conditions)
  // -------------------------------------------------------------------------

  static async find<T extends Model>(
    this: new () => T,
    conditions: Partial<T> | Record<string, any> = {},
    options: FindOptions = {},
  ): Promise<T[]> {
    const model = this as any;

    if (!model.adapter) throw new GirdNoAdapterError(model.name);

    const q = new QueryBuilder(model, model.adapter)
      .select("*")
      .where(conditions as Record<string, any>);

    applyOptions(q, options);

    const { sql, params } = q.toSQL();

    try {
      const rows = await model.adapter.query(sql, params);
      return (rows as Record<string, any>[]).map((row) =>
        toInstance(this, row),
      );
    } catch (err: any) {
      throw wrapPostgresError(err);
    }
  }

  // -------------------------------------------------------------------------
  // 4. ALL (shorthand for find with no conditions)
  // -------------------------------------------------------------------------

  static async all<T extends Model>(
    this: new () => T,
    options: FindOptions = {},
  ): Promise<T[]> {
    return (this as any).find({}, options);
  }

  // -------------------------------------------------------------------------
  // 5. UPDATE (static — updates by id, returns updated row)
  // -------------------------------------------------------------------------

  static async update<T extends Model>(
    this: new () => T,
    id: number | string,
    data: Partial<T>,
  ): Promise<T | null> {
    const model = this as any;

    if (!model.adapter) throw new GirdNoAdapterError(model.name);

    const q = new QueryBuilder(model, model.adapter)
      .update(data as Record<string, any>)
      .where({ id });

    const { sql, params } = q.toSQL();

    try {
      const res = await model.adapter.query(sql, params);
      return res[0] ? toInstance(this, res[0] as Record<string, any>) : null;
    } catch (err: any) {
      throw wrapPostgresError(err);
    }
  }

  // -------------------------------------------------------------------------
  // 6. DELETE
  // -------------------------------------------------------------------------

  static async delete<T extends Model>(
    this: new () => T,
    id: number | string,
  ): Promise<void> {
    const model = this as any;

    if (!model.adapter) throw new GirdNoAdapterError(model.name);

    const q = new QueryBuilder(model, model.adapter).delete().where({ id });

    const { sql, params } = q.toSQL();

    try {
      await model.adapter.query(sql, params);
    } catch (err: any) {
      throw wrapPostgresError(err);
    }
  }

  // -------------------------------------------------------------------------
  // 7. INSTANCE METHOD: save()
  //
  // Works on any Model instance — whether constructed manually or returned
  // from create() / find() / get() (those now return real instances via
  // toInstance(), so .save() is always available and functional).
  //
  // Rules:
  //   - If the instance has a primary key value  → UPDATE
  //   - If the instance has NO primary key value → throw (use Model.create())
  // -------------------------------------------------------------------------

  async save(): Promise<this> {
    const model = this.constructor as any;

    if (!model.adapter) throw new GirdNoAdapterError(model.name ?? "Model");

    // Read column metadata set by @Column decorators
    const columns: any[] = Reflect.getMetadata("gird:columns", model) ?? [];

    if (columns.length === 0) {
      throw new GirdSaveError(
        `No @Column definitions found on "${model.name}". ` +
          "Make sure you added @Column decorators and imported reflect-metadata.",
      );
    }

    // Locate the primary key column
    const pkCol = columns.find((c: any) => c.options.primary);

    if (!pkCol) {
      throw new GirdMissingPrimaryKeyError(model.name ?? "Model");
    }

    const pkValue = (this as any)[pkCol.name];

    if (pkValue === undefined || pkValue === null) {
      throw new GirdSaveError(
        "Instance has no primary key value. " +
          "Use Model.create() to insert new records.",
      );
    }

    // Collect current values for all non-pk, non-generated columns
    const data: Record<string, any> = {};

    for (const col of columns) {
      // Never try to SET the primary key or an auto-generated column
      if (col.options.primary || col.options.generated) continue;

      const val = (this as any)[col.name];

      if (val !== undefined) {
        data[col.name] = val;
      }
    }

    if (Object.keys(data).length === 0) {
      // Nothing changed — no-op
      return this;
    }

    const q = new QueryBuilder(model, model.adapter)
      .update(data)
      .where({ [pkCol.name]: pkValue });

    const { sql, params } = q.toSQL();

    try {
      const res = await model.adapter.query(sql, params);

      // Sync any server-side defaults / timestamps back onto this instance
      if (res[0]) {
        Object.assign(this, res[0]);
      }
    } catch (err: any) {
      throw wrapPostgresError(err);
    }

    return this;
  }
}
