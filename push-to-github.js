#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

const repoPath = 'C:\\Users\\Lucas\\Desktop\\banca-no-ponto.worktrees\\agents-fix-import-syntax-error-and-api-500';

console.log('='.repeat(60));
console.log('BANCA NO PONTO - GIT PUSH');
console.log('='.repeat(60));
console.log('');

try {
  process.chdir(repoPath);
  console.log(`📁 Working directory: ${repoPath}\n`);
  
  // Step 1: Check status
  console.log('Step 1️⃣ : Checking git status...');
  const status = execSync('git status --short', { encoding: 'utf8' });
  console.log(status || '✅ All committed');
  console.log('');
  
  // Step 2: Add changes
  console.log('Step 2️⃣ : Adding all changes...');
  execSync('git add -A', { encoding: 'utf8' });
  console.log('✅ Files staged');
  console.log('');
  
  // Step 3: Commit
  console.log('Step 3️⃣ : Creating commit...');
  const commitMsg = `Fix Vercel build - install frontend dependencies before build

- Updated package.json build script to run npm install in frontend directory before react-scripts build
- This ensures all React dependencies are available at build time
- Fixes: react-scripts: command not found error during Vercel deployment
- Fixes: SyntaxError Cannot use import statement outside a module

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`;

  try {
    execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    console.log('✅ Commit created');
  } catch (e) {
    if (e.message.includes('nothing to commit')) {
      console.log('ℹ️  No changes to commit');
    } else {
      throw e;
    }
  }
  console.log('');
  
  // Step 4: Push
  console.log('Step 4️⃣ : Pushing to GitHub...');
  const pushOutput = execSync('git push', { encoding: 'utf8' });
  console.log(pushOutput);
  console.log('✅ Push completed successfully!');
  console.log('');
  
  console.log('='.repeat(60));
  console.log('✨ SUCCESS! All changes pushed to GitHub ✨');
  console.log('='.repeat(60));
  console.log('');
  console.log('📍 Repository: https://github.com/pedro-henrique-gomez/Sistema-de-venda');
  console.log('🔀 Branch: agents/fix-import-syntax-error-and-api-500');
  console.log('');
  console.log('⚡ Vercel will automatically detect the push and start a new build!');
  console.log('📊 Check status at: https://vercel.com/dashboard');
  console.log('');
  
} catch (error) {
  console.error('\n❌ ERROR:');
  console.error(error.message);
  if (error.stdout) console.error(error.stdout.toString());
  if (error.stderr) console.error(error.stderr.toString());
  process.exit(1);
}
