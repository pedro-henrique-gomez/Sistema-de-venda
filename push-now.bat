@echo off
setlocal enabledelayedexpansion

cd /d "C:\Users\Lucas\Desktop\banca-no-ponto.worktrees\agents-fix-import-syntax-error-and-api-500"

echo.
echo ============================================================
echo BANCA NO PONTO - GIT PUSH
echo ============================================================
echo.

echo Executing git operations...
node push-to-github.js

if !errorlevel! equ 0 (
    echo.
    echo ============================================================
    echo SUCCESS! Pushing to GitHub...
    echo ============================================================
    echo.
    timeout /t 2 /nobreak
    start https://github.com/pedro-henrique-gomez/Sistema-de-venda
) else (
    echo.
    echo PUSH FAILED!
    pause
)
