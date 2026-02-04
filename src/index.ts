import "reflect-metadata"; // <--- 1. CRITICAL: Needed for decorators to work

// 2. The Decorators (Must come first to override any other 'Column')
// Ensure you created src/core/decorators.ts as discussed!
export * from "./core/decorators"; 

// 3. The Model Class (Fixes "no exported member Model")
export * from "./core/model";

// 4. Core Tools 
export * from "./core/table";

// 5. Database Engine
export * from "./db";

// 6. Drivers
export * from "./drivers/postgres";

// 7. Types
export * from "./core/adapter";