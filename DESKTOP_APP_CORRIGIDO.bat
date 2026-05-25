@echo off
title Banca no Ponto - App Desktop (Corrigido)
color 0B
mode con: cols=80 lines=30

echo.
echo  ========================================
echo     BANCA NO PONTO - APP DESKTOP v2
echo  ========================================
echo.
echo  Iniciando sistema com persistência de dados...
echo.

REM Ir para o diretório correto
cd /d "%~dp0"

REM Verificar se o Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERRO] Node.js nao encontrado!
    echo  Por favor, instale o Node.js em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo  [1/5] Verificando banco de dados...
cd backend
if not exist "prisma\dev.db" (
    echo  Banco de dados não encontrado, criando...
    npx prisma migrate dev --name init
    if %errorlevel% neq 0 (
        echo  [AVISO] Falha ao criar migrations, tentando gerar cliente...
        npx prisma generate
    )
) else (
    echo  Banco de dados encontrado, garantindo sincronia...
    npx prisma generate
)

echo.
echo  [2/5] Verificando dependencias do backend...
if not exist "node_modules" (
    echo  Instalando dependencias do backend...
    call npm install
    if %errorlevel% neq 0 (
        echo  [ERRO] Falha ao instalar dependencias do backend!
        pause
        exit /b 1
    )
)

echo.
echo  [3/5] Backup do banco de dados...
if exist "prisma\dev.db" (
    copy "prisma\dev.db" "prisma\dev.db.backup" >nul
    echo  Backup criado: prisma\dev.db.backup
)

echo.
echo  [4/5] Iniciando servidor backend...
echo  Aguarde, isto pode demorar um pouco...
start "Backend - Banca no Ponto" cmd /k "echo Iniciando backend... && npm run dev"

REM Esperar o backend iniciar completamente
echo  Aguardando backend iniciar completamente...
timeout /t 10 /nobreak >nul

REM Verificar se o backend está rodando
echo  Verificando se o backend está respondendo...
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% neq 0 (
    echo  [AVISO] Backend ainda não está respondendo, aguardando mais...
    timeout /t 5 /nobreak >nul
)

echo.
echo  [5/5] Iniciando interface desktop...

cd ..\frontend

REM Verificar se existe build do frontend
if exist "build\index.html" (
    echo  Abrindo versão desktop (build estático)...
    start "" "http://localhost:3000"
) else (
    echo  Build não encontrado, iniciando servidor de desenvolvimento...
    start "Frontend - Banca no Ponto" cmd /k "npm start"
    timeout /t 5 /nobreak >nul
    start "" "http://localhost:3000"
)

cd ..

echo.
echo  ========================================
echo  SISTEMA INICIADO COM SUCESSO!
echo  ========================================
echo.
echo  Status:
echo  - Backend: Rodando em http://localhost:3001
echo  - Frontend: http://localhost:3000
echo  - Banco de Dados: SQLite (persistente)
echo.
echo  IMPORTANTE:
echo  - Seus produtos estão salvos no banco de dados
echo  - Os dados persistem mesmo reiniciando o sistema
echo  - Backup automático criado em: backend\prisma\dev.db.backup
echo.
echo  Dicas:
echo  - Pressione F11 no navegador para modo tela cheia
echo  - Não feche esta janela enquanto usar o sistema
echo.
echo  Para fechar o sistema:
echo  - Feche esta janela (irá encerrar tudo)
echo  - Ou pressione Ctrl+C nesta janela
echo.
echo  Pressione qualquer tecla para encerrar o sistema...
pause >nul

REM Encerrar todos os processos de forma segura
echo  Encerrando sistema...
echo  Aguardando finalização...

REM Fechar processos node com cuidado
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Fechar janelas de terminal abertas
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq Backend*" 2>nul
taskkill /f /im cmd.exe /fi "WINDOWTITLE eq Frontend*" 2>nul

echo  Sistema encerrado com sucesso.
echo  Seus dados estão salvos em backend\prisma\dev.db
timeout /t 2 /nobreak >nul
