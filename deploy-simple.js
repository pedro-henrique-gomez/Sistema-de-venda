#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const repoPath = path.resolve(__dirname);
const commitMsg = `Fix Vercel build - install frontend dependencies before build

- Updated package.json build script to run npm install in frontend directory
- This ensures all React dependencies are available when running react-scripts build
- Fixes react-scripts: command not found error during Vercel deployment

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`;

console.log('========================================');
console.log('Deployment Script - Banca no Ponto');
console.log('========================================\n');

function runCommand(cmd, args, description) {
  console.log(`\n${description}...`);
  const result = spawnSync(cmd, args, {
    cwd: repoPath,
    shell: true,
    stdio: 'inherit',
    encoding: 'utf8'
  });
  
  if (result.error) {
    console.error(`❌ Error: ${result.error.message}`);
    return false;
  }
  
  if (result.status !== 0) {
    console.error(`❌ Command failed with exit code ${result.status}`);
    return false;
  }
  
  return true;
}

try {
  // Step 1: Git status
  if (!runCommand('git', ['status'], 'Step 1: Checking git status')) {
    throw new Error('Git status failed');
  }
  
  // Step 2: Add all files
  if (!runCommand('git', ['add', '-A'], 'Step 2: Adding all changes')) {
    throw new Error('Git add failed');
  }
  
  // Step 3: Commit
  if (!runCommand('git', ['commit', '-m', commitMsg], 'Step 3: Creating commit')) {
    throw new Error('Git commit failed');
  }
  
  // Step 4: Push
  if (!runCommand('git', ['push'], 'Step 4: Pushing to GitHub')) {
    throw new Error('Git push failed');
  }
  
  console.log('\n========================================');
  console.log('✓ Deployment completed successfully!');
  console.log('========================================\n');
  console.log('Vercel will automatically build the latest changes.');
  console.log('Check: https://vercel.com/dashboard\n');
  
} catch (error) {
  console.error('\n❌ Error during deployment:');
  console.error(error.message);
  process.exit(1);
}
