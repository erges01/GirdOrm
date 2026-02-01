#!/usr/bin/env node
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(__dirname, "gird.ts");
const args = process.argv.slice(2);

let command;
let commandArgs;

if (process.platform === "win32") {
  // Windows: We must manually invoke cmd /c to run npx without 'shell: true'
  command = "cmd.exe";
  commandArgs = ["/c", "npx", "tsx", scriptPath, ...args];
} else {
  // Mac/Linux: Can run npx directly
  command = "npx";
  commandArgs = ["tsx", scriptPath, ...args];
}

const child = spawn(command, commandArgs, {
  stdio: "inherit",
  // We do NOT use shell: true, so the warning is gone.
  // We handled the shell manually above for Windows.
});

child.on("exit", (code) => process.exit(code));