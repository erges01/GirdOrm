// src/index.ts

// 1. Core Tools
export * from "./core/table";
export * from "./core/config";
export * from "./core/model";

// 2. Database Engine
export * from "./db";

// 3. Drivers
export * from "./drivers/postgres";

// 4. Types
// 👇 FIX: Export 'DBAdapter', not 'Adapter'
export type { DBAdapter } from "./core/adapter";