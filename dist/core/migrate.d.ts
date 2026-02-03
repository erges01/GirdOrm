import { GirdDB } from "../db";
export declare class Migrator {
    private db;
    private schemaDir;
    constructor(db: GirdDB, schemaDir: string);
    sync(): Promise<void>;
    private syncTable;
}
