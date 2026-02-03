const fs = require('fs');
const path = require('path');

// Folders/Files to ignore
const IGNORE = new Set(['node_modules', '.git', '.vscode', '.idea', 'dist']); 
// NOTE: I kept 'dist' in ignore initially to keep it clean, 
// BUT for this specific error, we NEED to see inside dist. 
// Let's remove 'dist' from the ignore list for this run.

const IGNORE_LIST = ['node_modules', '.git', '.vscode', '.idea'];

function printTree(dir, prefix = '') {
    const items = fs.readdirSync(dir).filter(item => !IGNORE_LIST.includes(item));

    items.forEach((item, index) => {
        const isLast = index === items.length - 1;
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);

        console.log(`${prefix}${isLast ? '└── ' : '├── '}${item}`);

        if (stats.isDirectory()) {
            printTree(fullPath, prefix + (isLast ? '    ' : '│   '));
        }
    });
}

console.log(`📂 Project: ${path.basename(process.cwd())}`);
printTree(process.cwd());