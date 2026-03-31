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
require("reflect-metadata"); // <--- CRITICAL: Needed for decorators to work
// 1. The Decorators
__exportStar(require("./core/decorators"), exports);
// 2. The Model Class
__exportStar(require("./core/model"), exports);
// 3. Core Tools
__exportStar(require("./core/table"), exports);
// 4. Database Engine
__exportStar(require("./db"), exports);
// 5. Drivers
__exportStar(require("./drivers/postgres"), exports);
// 6. Types
__exportStar(require("./core/adapter"), exports);
// 7. Errors  (GirdError, GirdUniqueConstraintError, GirdForeignKeyError, etc.)
__exportStar(require("./core/errors"), exports);
