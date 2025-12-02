#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all test files in tier directories
const findTierTestFiles = () => {
  const output = execSync(
    'find cypress/e2e/tests/{ci,tier0,tier1,tier2,tier3,tier4,tier5,NO_TAG} -name "*.test.ts" -type f 2>/dev/null || true',
    { encoding: 'utf-8' }
  );
  return output.trim().split('\n').filter(f => f);
};

// Fix imports in a file by adding one more ../ to relative paths
const fixImportsInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Pattern to match relative imports to models, utils, types
  // Match: from "../../../models/... or from "../../../utils/... or from "../../../types/...
  const importPattern = /from\s+["'](\.\.\/)+(models|utils|types|support)\//g;

  // Replace by adding one more ../
  const newContent = content.replace(importPattern, (match, dots, folder) => {
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
console.log('=== Fixing Relative Imports in Tier Test Files ===\n');

const files = findTierTestFiles();
console.log(`Found ${files.length} test files in tier directories\n`);

let fixedCount = 0;
let unchangedCount = 0;

files.forEach(file => {
  const fixed = fixImportsInFile(file);
  if (fixed) {
    console.log(`✓ Fixed: ${file}`);
    fixedCount++;
  } else {
    unchangedCount++;
  }
});

console.log(`\n=== Summary ===`);
console.log(`Files with fixed imports: ${fixedCount}`);
console.log(`Files unchanged: ${unchangedCount}`);
console.log(`Total files processed: ${files.length}`);
