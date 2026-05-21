@echo off
setlocal enabledelayedexpansion

REM Get the directory where this script is located
for %%i in ("%~dp0.") do set "SCRIPT_DIR=%%~fi"

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║        🚀 BANCA NO PONTO - DEPLOY VERCEL AUTOMÁTICO 🚀        ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

REM Change to project directory
cd /d "%SCRIPT_DIR%" || (
    echo ERROR: Could not change to project directory
    pause
    exit /b 1
)

echo [1/4] Verificando Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git não está instalado!
    echo Acesse: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo ✓ Git OK

echo.
echo [2/4] Adicionando arquivos ao Git...
git add .
if errorlevel 1 (
    echo ❌ Erro ao adicionar arquivos
    pause
    exit /b 1
)
echo ✓ Arquivos adicionados

echo.
echo [3/4] Fazendo commit...
git commit -m "Deploy: Banca no Ponto - Fix API 500 e preparar Vercel

Changes:
- Fixed: vendas.js - TypeError filter is not a function (linhas 384-394)
- Added: Documentação de deployment
- Added: Scripts de build automatizados
- Verified: vercel.json configurado
- Status: Pronto para deploy no Vercel

Frontend: Vercel fará build automático
Backend: Node.js serverless
Database: Conectar variáveis de ambiente

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

if errorlevel 1 (
    echo ⚠️  Nada para fazer commit (repositório já atualizado)
)
echo ✓ Commit realizado

echo.
echo [4/4] Fazendo push para GitHub...
git push origin main
if errorlevel 1 (
    echo ❌ Erro ao fazer push!
    echo Verifique sua conexão com GitHub
    pause
    exit /b 1
)
echo ✓ Push realizado com sucesso!

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║     ✓ GIT PUSH CONCLUÍDO COM SUCESSO! ✓                       ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo PRÓXIMO PASSO: Conectar ao Vercel
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo 1. Acesse: https://vercel.com/login
echo 2. Clique: "New Project"
echo 3. Selecione: seu repositório "banca-no-ponto"
echo 4. Clique: "Import"
echo 5. Configure variáveis de ambiente:
echo    - DATABASE_URL=sua-string-conexao
echo    - JWT_SECRET=sua-chave-secreta
echo 6. Clique: "Deploy"
echo.
echo Vercel fará tudo automaticamente!
echo.
pause
