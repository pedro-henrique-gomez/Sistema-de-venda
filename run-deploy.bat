@echo off
cd /d C:\Users\Lucas\Desktop\banca-no-ponto.worktrees\agents-fix-import-syntax-error-and-api-500

echo ========================================
echo Deployment Script - Banca no Ponto
echo ========================================
echo.

echo Executing Node.js deployment script...
node deploy.js

if %errorlevel% equ 0 (
    echo.
    echo Opening Vercel Dashboard...
    start https://vercel.com/dashboard
) else (
    echo.
    echo DEPLOYMENT FAILED!
    pause
)
