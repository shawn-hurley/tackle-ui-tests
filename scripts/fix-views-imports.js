#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');

// Find all test files in tier directories
const findTierTestFiles = () => {
  const output = execSync(
    'find cypress/e2e/tests/{ci,tier0,tier1,tier2,tier3,tier4,tier5,NO_TAG} -name "*.test.ts" -type f 2>/dev/null || true',
    { encoding: 'utf-8' }
  );
  return output.trim().split('\n').filter(f => f);
};

// Fix views imports in a file by adding one more ../ to relative paths
const fixViewsImportsInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Pattern to match relative imports to views
  // Match: from "../../../views/... or from "../../../../views/...
  const viewsPattern = /from\s+["'](\.\.\/)+(views)\//g;

  // Replace by adding one more ../
  const newContent = content.replace(viewsPattern, (match, dots, folder) => {
    modified = true;
    // Count current ../ and add one more
    const dotCount = (match.match(/\.\.\//g) || []).length;
    const newDots = '../'.repeat(dotCount + 1);
    return `from "${newDots}${folder}/`;
  });

  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    return true;
  }
  return false;
};

// Main execution
console.log('=== Fixing Views Imports in Tier Test Files ===\n');

const files = findTierTestFiles();
console.log(`Checking ${files.length} test files\n`);

let fixedCount = 0;
let unchangedCount = 0;

files.forEach(file => {
  const fixed = fixViewsImportsInFile(file);
  if (fixed) {
    console.log(`✓ Fixed: ${file}`);
    fixedCount++;
  } else {
    unchangedCount++;
  }
});

console.log(`\n=== Summary ===`);
console.log(`Files with fixed views imports: ${fixedCount}`);
console.log(`Files unchanged: ${unchangedCount}`);
console.log(`Total files processed: ${files.length}`);
