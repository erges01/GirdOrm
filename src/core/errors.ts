// src/core/errors.ts

// --- BASE ERROR ---
export class GirdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GirdError";
    // Restore prototype chain (needed when extending built-ins in TS)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// --- CONSTRAINT ERRORS ---

export class GirdUniqueConstraintError extends GirdError {
  public readonly constraint: string;
  public readonly detail: string;

  constructor(constraint: string, detail: string) {
    super(`Unique constraint violated on "${constraint}". ${detail}`);
    this.name = "GirdUniqueConstraintError";
    this.constraint = constraint;
    this.detail = detail;
  }
}

export class GirdForeignKeyError extends GirdError {
  public readonly detail: string;

  constructor(detail: string) {
    super(`Foreign key constraint violated: ${detail}`);
    this.name = "GirdForeignKeyError";
    this.detail = detail;
  }
}

export class GirdNotNullError extends GirdError {
  public readonly column: string;

  constructor(column: string) {
    super(`NOT NULL constraint violated on column: "${column}"`);
    this.name = "GirdNotNullError";
    this.column = column;
  }
}

// --- QUERY / USAGE ERRORS ---

export class GirdRelationNotFoundError extends GirdError {
  public readonly relation: string;
  public readonly model: string;

  constructor(relationName: string, modelName: string) {
    super(
      `Relation "${relationName}" not found on model "${modelName}". ` +
      `Did you add @HasMany or @BelongsTo?`
    );
    this.name = "GirdRelationNotFoundError";
    this.relation = relationName;
    this.model = modelName;
  }
}

export class GirdMissingPrimaryKeyError extends GirdError {
  constructor(modelName: string) {
    super(
      `Model "${modelName}" has no @Column with { primary: true }. ` +
      `Every model must have a primary key.`
    );
    this.name = "GirdMissingPrimaryKeyError";
  }
}

export class GirdNoAdapterError extends GirdError {
  constructor(modelName: string) {
    super(
      `Model "${modelName}" has no database adapter. ` +
      `Did you call db.register([${modelName}])?`
    );
    this.name = "GirdNoAdapterError";
  }
}

export class GirdSaveError extends GirdError {
  constructor(reason: string) {
    super(`Cannot save instance: ${reason}`);
    this.name = "GirdSaveError";
  }
}

// --- POSTGRES ERROR WRAPPER ---

/**
 * Maps a raw pg error (with a Postgres error code) to a typed GirdError.
 * Falls back to a plain GirdError for unknown codes.
 *
 * Postgres error codes reference:
 * https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export function wrapPostgresError(err: any): GirdError {
  // If it's already one of ours, pass it through
  if (err instanceof GirdError) return err;

  switch (err.code) {
    // 23505 — unique_violation
    case "23505":
      return new GirdUniqueConstraintError(
        err.constraint ?? "unknown",
        err.detail ?? ""
      );

    // 23503 — foreign_key_violation
    case "23503":
      return new GirdForeignKeyError(err.detail ?? "unknown");

    // 23502 — not_null_violation
    case "23502":
      return new GirdNotNullError(err.column ?? "unknown");

    // 42P01 — undefined_table
    case "42P01":
      return new GirdError(
        `Table does not exist: ${err.message}. Did you call db.init()?`
      );

    // 42703 — undefined_column
    case "42703":
      return new GirdError(
        `Column does not exist: ${err.message}. Did you run db.init() after adding the column?`
      );

    // 08006 / 08001 — connection failure
    case "08006":
    case "08001":
      return new GirdError(
        `Database connection failed: ${err.message}. Check your DATABASE_URL.`
      );

    default: {
      const wrapped = new GirdError(err.message ?? "An unknown database error occurred.");
      // Preserve the original stack so it's still debuggable
      wrapped.stack = err.stack;
      return wrapped;
    }
  }
}
