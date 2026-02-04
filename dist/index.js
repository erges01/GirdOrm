"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata"); // <--- 1. CRITICAL: Needed for decorators to work
// 2. The Decorators (Must come first to override any other 'Column')
// Ensure you created src/core/decorators.ts as discussed!
__exportStar(require("./core/decorators"), exports);
// 3. The Model Class (Fixes "no exported member Model")
__exportStar(require("./core/model"), exports);
// 4. Core Tools 
__exportStar(require("./core/table"), exports);
// 5. Database Engine
__exportStar(require("./db"), exports);
// 6. Drivers
__exportStar(require("./drivers/postgres"), exports);
// 7. Types
__exportStar(require("./core/adapter"), exports);
