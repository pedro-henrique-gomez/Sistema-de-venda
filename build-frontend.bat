@echo off
setlocal enabledelayedexpansion

REM Get the directory where this script is located
for %%i in ("%~dp0.") do set "SCRIPT_DIR=%%~fi"

echo.
echo ========================================
echo   Banca no Ponto - Frontend Build
echo ========================================
echo.

REM Change to frontend directory
cd /d "%SCRIPT_DIR%\frontend"
if errorlevel 1 (
    echo ERROR: Could not change to frontend directory
    echo Expected path: %SCRIPT_DIR%\frontend
    pause
    exit /b 1
)

echo [1/2] Installing dependencies...
echo.
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)

echo.
echo [2/2] Building frontend...
echo.
call npm run build
if errorlevel 1 (
    echo ERROR: npm run build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✓ Build completed successfully!
echo ========================================
echo.
echo Frontend files generated in: %SCRIPT_DIR%\frontend\build
echo.
pause
