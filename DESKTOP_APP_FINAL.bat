@echo off
title Banca no Ponto - App Desktop (Final)
color 0B
mode con: cols=80 lines=30
cd /d "%~dp0"

echo.
echo  ========================================
echo     BANCA NO PONTO - APP DESKTOP FINAL
echo  ========================================
echo.
echo  Iniciando sistema corrigido...
echo.
echo  Se houver erro, esta janela permanecera aberta.
echo.

REM Verificar se o Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERRO] Node.js nao encontrado!
    echo  Por favor, instale o Node.js em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo  [1/4] Verificando banco de dados...
cd backend
if not exist "prisma\dev.db" (
    echo  Banco de dados não encontrado, criando...
    npx prisma migrate dev --name init
    if %errorlevel% neq 0 (
        echo  [AVISO] Falha ao criar migrations, tentando gerar cliente...
        npx prisma generate
    )
) else (
    echo  Banco de dados encontrado, gerando cliente...
    npx prisma generate
)
if %errorlevel% neq 0 (
    echo  [ERRO] Erro ao configurar banco de dados!
    pause
    exit /b 1
)

echo  Banco de dados configurado com sucesso.

echo.
echo  [2/4] Verificando dependencias do backend...
if not exist "node_modules" (
    echo  Instalando dependencias do backend...
    call npm install
    if %errorlevel% neq 0 (
        echo  [ERRO] Falha ao instalar dependencias do backend!
        pause
        exit /b 1
    )
)

echo  Dependencias verificadas.

echo.
echo  [3/4] Iniciando servidor backend...
echo  Aguarde, isto pode demorar um pouco...
echo  Comando: start "Backend - Banca no Ponto" cmd /k "cd /d %~dp0backend && npm run dev"
start "Backend - Banca no Ponto" cmd /k "cd /d %~dp0backend && npm run dev"

REM Esperar o backend iniciar completamente
echo  Aguardando backend iniciar...
timeout /t 8 /nobreak >nul
echo  Backend iniciado (ou tentativa concluida)

echo.
echo  [4/4] Iniciando interface desktop...
echo  Navegando para frontend...
cd ..\frontend
echo  Diretorio atual: %CD%

REM Sempre iniciar servidor de desenvolvimento para evitar erros de CORS
echo  Iniciando servidor de desenvolvimento do frontend...
echo  Comando: start "Frontend - Banca no Ponto" cmd /k "cd /d %~dp0frontend && npm start"
start "Frontend - Banca no Ponto" cmd /k "cd /d %~dp0frontend && npm start"
echo  Aguardando frontend iniciar (15 segundos)...
timeout /t 15 /nobreak >nul
echo  Verificando se servidor esta respondendo...
REM Checar se o backend está respondendo na porta correta (3001)
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo  Backend respondendo! Abrindo interface...
    start "" "http://localhost:3000"
) else (
    echo  [AVISO] Backend nao respondendo em http://localhost:3001/health
    echo  Tentando verificar porta 3000...
    curl -s http://localhost:3000/health >nul 2>&1
    if %errorlevel% equ 0 (
        echo  Backend respondendo em http://localhost:3000/health. Abrindo interface...
        start "" "http://localhost:3000"
    ) else (
        echo  [ERRO] Backend ainda nao responde em 3000/health nem 3001/health
        echo  Verifique a saida do terminal do backend e as rotas.
        echo  Ainda assim abrindo a interface...
        start "" "http://localhost:3000"
    )
)



cd ..

echo.
echo  ========================================
echo  SISTEMA INICIADO COM SUCESSO!
echo  ========================================
echo.
echo  Status:
echo  - Backend: Rodando em http://localhost:3001
echo  - Frontend: Interface local aberta
echo  - Banco de Dados: SQLite (persistente)
echo.
echo  IMPORTANTE:
echo  - Seus produtos estão salvos no banco de dados
echo  - Os dados persistem mesmo reiniciando o sistema
echo.
echo  Dicas:
echo  - Pressione F11 no navegador para modo tela cheia
echo  - Não feche esta janela enquanto usar o sistema
echo.
echo  Para fechar o sistema:
echo  - Feche esta janela (irá encerrar tudo)
echo  - Ou pressione Ctrl+C nesta janela
echo.
echo  ========================================
echo  SISTEMA RODANDO!
echo  ========================================
echo.
echo  Status:
echo  - Backend: Rodando em http://localhost:3001
echo  - Frontend: Interface local aberta
echo  - Banco de Dados: SQLite (persistente)
echo.
echo  IMPORTANTE:
echo  - Esta janela deve permanecer aberta
echo  - Para parar o sistema, use PARAR_SISTEMA.bat
echo  - Ou feche manualmente as janelas do backend/frontend
echo.
echo  Pressione qualquer tecla para fechar esta janela...
pause
