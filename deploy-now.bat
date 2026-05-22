@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Deployment Script - Banca no Ponto
echo ========================================
echo.

echo Step 1: Checking git status...
git status
echo.

echo Step 2: Adding all changes...
git add -A
echo.

echo Step 3: Creating commit...
git commit -m "Fix Vercel build - install frontend dependencies before build

- Updated package.json build script to run 'npm install' in frontend directory
- This ensures all React dependencies are available when running react-scripts build
- Fixes 'react-scripts: command not found' error during Vercel deployment

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
echo.

echo Step 4: Pushing to GitHub...
git push
echo.

echo Step 5: Opening Vercel Dashboard...
timeout /t 3 /nobreak
start https://vercel.com/dashboard

echo.
echo ========================================
echo Deployment completed!
echo ========================================
pause
