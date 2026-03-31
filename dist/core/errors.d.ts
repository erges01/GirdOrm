export declare class GirdError extends Error {
    constructor(message: string);
}
export declare class GirdUniqueConstraintError extends GirdError {
    readonly constraint: string;
    readonly detail: string;
    constructor(constraint: string, detail: string);
}
export declare class GirdForeignKeyError extends GirdError {
    readonly detail: string;
    constructor(detail: string);
}
export declare class GirdNotNullError extends GirdError {
    readonly column: string;
    constructor(column: string);
}
export declare class GirdRelationNotFoundError extends GirdError {
    readonly relation: string;
    readonly model: string;
    constructor(relationName: string, modelName: string);
}
export declare class GirdMissingPrimaryKeyError extends GirdError {
    constructor(modelName: string);
}
export declare class GirdNoAdapterError extends GirdError {
    constructor(modelName: string);
}
export declare class GirdSaveError extends GirdError {
    constructor(reason: string);
}
/**
 * Maps a raw pg error (with a Postgres error code) to a typed GirdError.
 * Falls back to a plain GirdError for unknown codes.
 *
 * Postgres error codes reference:
 * https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export declare function wrapPostgresError(err: any): GirdError;
