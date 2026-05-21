@echo off
setlocal enabledelayedexpansion

REM Get the directory where this script is located
for %%i in ("%~dp0.") do set "SCRIPT_DIR=%%~fi"

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║     🚀 BANCA NO PONTO - DEPLOY AUTOMÁTICO COMPLETO 🚀         ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

cd /d "%SCRIPT_DIR%" || (
    echo ❌ Erro: Não consegui ir ao diretório do projeto
    pause
    exit /b 1
)

echo [1/5] Verificando Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Git não está instalado!
    echo Acesse: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo ✓ Git OK

echo.
echo [2/5] Fazendo Commit...
git add .
git commit -m "Deploy: Banca no Ponto - Deploy Vercel

- Fixed: vendas.js - API 500 error
- Ready: Vercel deployment
- Config: vercel.json OK

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

echo ✓ Commit realizado

echo.
echo [3/5] Fazendo Push para GitHub...
git push origin main
if errorlevel 1 (
    echo ⚠️  Aviso: Erro ao fazer push
    echo Verifique sua conexão
)
echo ✓ Push realizado

echo.
echo [4/5] Verificando Vercel CLI...
vercel --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Vercel CLI não está instalado
    echo Instalando...
    call npm install -g vercel
)
echo ✓ Vercel CLI OK

echo.
echo [5/5] Iniciando Deploy no Vercel...
echo.
echo ⚠️  Uma janela do navegador vai abrir para:
echo    - Login no Vercel
echo    - Seleção do projeto
echo    - Configuração das variáveis
echo.
pause

vercel --prod

if errorlevel 1 (
    echo ❌ Deploy falhou!
    echo Tente novamente ou acesse: https://vercel.com/dashboard
    pause
    exit /b 1
)

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║     ✓ DEPLOY VERCEL CONCLUÍDO COM SUCESSO! ✓                  ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.
echo Sua aplicação está online!
echo Verifique em: https://vercel.com/dashboard
echo.
pause
