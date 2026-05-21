@echo off
setlocal enabledelayedexpansion

REM Change to project root
cd /d "%~dp0"

echo.
echo ========================================
echo   Committing fixes to Git
echo ========================================
echo.

echo Adding files...
git add backend/src/routes/vendas.js
git add build-frontend.bat
git add build-frontend.sh
git add FIX_FRONTEND_BUILD.md
git add CORREÇÕES_REALIZADAS.txt
git add CHECKLIST_CORREÇÕES.md

echo.
echo Creating commit...
git commit -m "Fix: Corrigir API 500 e frontend build issues

Backend (vendas.js):
- Removido optional chaining que causava 'filter is not a function'
- Adicionado verificacao explicita se venda.taxas eh array
- Linhas 384-394

Frontend:
- Criado script de build (build-frontend.bat/.sh)
- Adicionado documentacao completa das correções

Documentacao:
- FIX_FRONTEND_BUILD.md - Guia de correção
- CHECKLIST_CORREÇÕES.md - Checklist visual
- CORREÇÕES_REALIZADAS.txt - Resumo técnico

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

if errorlevel 1 (
    echo.
    echo ERROR: Git commit failed
    echo Make sure you have Git configured
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✓ Commit created successfully!
echo ========================================
echo.
echo Next steps:
echo   1. Execute: build-frontend.bat
echo   2. Run: git push origin main
echo.
pause
