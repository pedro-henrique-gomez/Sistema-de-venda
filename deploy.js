const { execSync } = require('child_process');
const path = require('path');

const repoPath = 'C:\\Users\\Lucas\\Desktop\\banca-no-ponto.worktrees\\agents-fix-import-syntax-error-and-api-500';

try {
  console.log('========================================');
  console.log('Deployment Script - Banca no Ponto');
  console.log('========================================\n');

  process.chdir(repoPath);
  
  console.log('Step 1: Checking git status...');
  console.log(execSync('git status', { encoding: 'utf8' }));
  
  console.log('\nStep 2: Adding all changes...');
  execSync('git add -A', { encoding: 'utf8' });
  console.log('✓ Files staged');
  
  console.log('\nStep 3: Creating commit...');
  const commitMsg = `Fix Vercel build - install frontend dependencies before build

- Updated package.json build script to run 'npm install' in frontend directory
- This ensures all React dependencies are available when running react-scripts build
- Fixes 'react-scripts: command not found' error during Vercel deployment

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`;
  
  execSync(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
  console.log('✓ Commit created');
  
  console.log('\nStep 4: Pushing to GitHub...');
  console.log(execSync('git push', { encoding: 'utf8' }));
  console.log('✓ Push completed');
  
  console.log('\n========================================');
  console.log('✓ Deployment completed successfully!');
  console.log('========================================');
  console.log('\nVercel will automatically build the latest changes.');
  console.log('Check: https://vercel.com/dashboard');
  
} catch (error) {
  console.error('\n❌ Error during deployment:');
  console.error(error.message);
  process.exit(1);
}
