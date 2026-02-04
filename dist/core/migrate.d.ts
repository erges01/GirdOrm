import { GirdDB } from "../db";
import "reflect-metadata";
export declare class Migrator {
    private db;
    constructor(db: GirdDB);
    sync(): Promise<void>;
}
