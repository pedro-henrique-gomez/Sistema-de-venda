@echo off
REM Script para auxiliar o deploy no Vercel (Windows)
REM Uso: deploy-vercel.bat

echo.
echo ════════════════════════════════════════════════════════════
echo      Preparando Deploy - Banca no Ponto no Vercel
echo ════════════════════════════════════════════════════════════
echo.

REM Verificar Git
echo Verificando Git...
git status >nul 2>&1
if errorlevel 1 (
    echo Erro: Nao e um repositorio Git
    exit /b 1
)
echo [OK] Repositorio Git encontrado

REM Verificar alteracoes nao commitadas
echo.
echo Verificando alteracoes...
git diff --quiet
if errorlevel 1 (
    echo Alteracoes detectadas. Commitando...
    git add .
    git commit -m "Preparado para deploy no Vercel"
)
echo [OK] Repositorio pronto para deploy

REM Verificar remoto
echo.
echo Verificando repositorio remoto...
git remote -v | findstr "origin" >nul 2>&1
if errorlevel 1 (
    echo Erro: Nenhum repositorio remoto configurado
    echo Execute: git remote add origin ^<sua-url-github^>
    exit /b 1
)
echo [OK] Repositorio remoto configurado

REM Push
echo.
echo Enviando codigo para o repositorio remoto...
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set CURRENT_BRANCH=%%i
git push origin %CURRENT_BRANCH%
if errorlevel 1 (
    echo Erro: Falha ao enviar codigo
    exit /b 1
)
echo [OK] Codigo enviado com sucesso

REM Verificar Vercel CLI
echo.
echo Verificando Vercel CLI...
where vercel >nul 2>&1
if errorlevel 1 (
    echo Instalando Vercel CLI...
    npm install -g vercel
)
echo [OK] Vercel CLI disponivel

REM Fim
echo.
echo ════════════════════════════════════════════════════════════
echo             Pronto para Deploy no Vercel!
echo ════════════════════════════════════════════════════════════
echo.
echo Proximos passos:
echo 1. Via Web Dashboard (Recomendado):
echo    - Acesse https://vercel.com/dashboard
echo    - Clique 'New Project'
echo    - Selecione seu repositorio
echo    - Configure variaveis de ambiente
echo    - Clique 'Deploy'
echo.
echo 2. Via CLI:
echo    - Execute: vercel --prod
echo    - Configure as variaveis quando solicitado
echo.
echo Documentacao: Consulte DEPLOY_VERCEL.md neste diretorio
echo.
pause
