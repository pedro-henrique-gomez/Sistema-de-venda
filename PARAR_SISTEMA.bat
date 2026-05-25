@echo off
title Banca no Ponto - Parando Sistema
color 0C
echo.
echo  ========================================
echo     BANCA NO PONTO - PARANDO SISTEMA
echo  ========================================
echo.

echo  [1/2] Parando servidor backend (porta 3001)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo  [2/2] Parando frontend (porta 3000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo  ========================================
echo  SISTEMA PARADO COM SUCESSO!
echo  ========================================
echo.
echo  Todos os servidores foram finalizados.
echo.
echo  Pressione qualquer tecla para fechar...
pause >nul
