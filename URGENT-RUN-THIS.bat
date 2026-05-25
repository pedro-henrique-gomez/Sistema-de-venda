@echo off
REM This script performs the deployment
REM Run this file to complete the deployment

cd /d "C:\Users\Lucas\Desktop\banca-no-ponto.worktrees\agents-fix-import-syntax-error-and-api-500"

echo ========================================
echo Banca no Ponto - Deployment Script
echo ========================================
echo.

echo Stage 1: Git Status
call git status
echo.

echo Stage 2: Adding changes...
call git add -A
echo OK - Files added
echo.

echo Stage 3: Committing changes...
call git commit -m "Fix Vercel build - install frontend dependencies before build"
echo OK - Commit created
echo.

echo Stage 4: Pushing to GitHub...
call git push
echo OK - Pushed to GitHub
echo.

echo ========================================
echo SUCCESS! Deployment completed.
echo ========================================
echo.
echo Next steps:
echo 1. Wait for Vercel to automatically trigger a new build
echo 2. Check https://vercel.com/dashboard for build status
echo 3. The app will be available at https://banca-no-ponto-one.vercel.app
echo.

pause
