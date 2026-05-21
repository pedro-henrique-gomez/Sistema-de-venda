const fs = require('fs');
const path = require('path');

console.log('🎉 Criando instalador simplificado...');

// Criar pasta dist se não existir
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

// Criar script de instalação
const installerScript = `@echo off
title Banca no Ponto - Instalação
color 0B
echo.
echo ========================================
echo    BANCA NO PONTO - INSTALAÇÃO
echo ========================================
echo.
echo Instalando Banca no Ponto...
echo.

REM Criar diretório de instalação
if not exist "%PROGRAMFILES%\\BancaNoPonto" mkdir "%PROGRAMFILES%\\BancaNoPonto"

REM Copiar arquivos do aplicativo
echo Copiando arquivos...
xcopy /E /I /Y ".\\BancaNoPonto-win32-x64" "%PROGRAMFILES%\\BancaNoPonto"

REM Criar atalho na área de trabalho
echo Criando atalhos...
powershell "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\\Desktop\\Banca no Ponto.lnk'); $Shortcut.TargetPath = '%PROGRAMFILES%\\BancaNoPonto\\BancaNoPonto.exe'; $Shortcut.Save()"

REM Criar atalho no menu iniciar
powershell "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Banca no Ponto.lnk'); $Shortcut.TargetPath = '%PROGRAMFILES%\\BancaNoPonto\\BancaNoPonto.exe'; $Shortcut.Save()"

echo.
echo ========================================
echo INSTALAÇÃO CONCLUÍDA COM SUCESSO!
echo ========================================
echo.
echo O Banca no Ponto foi instalado com sucesso!
echo.
echo Encontrado em:
echo - Área de Trabalho: "Banca no Ponto.lnk"
echo - Menu Iniciar: "Banca no Ponto.lnk"
echo - Pasta: %PROGRAMFILES%\\BancaNoPonto
echo.
echo Pressione qualquer tecla para sair...
pause >nul
`;

fs.writeFileSync(path.join(distPath, 'install.bat'), installerScript);

// Criar script de desinstalação
const uninstallerScript = `@echo off
title Banca no Ponto - Desinstalação
color 0C
echo.
echo ========================================
echo   BANCA NO PONTO - DESINSTALAÇÃO
echo ========================================
echo.
echo Removendo Banca no Ponto...
echo.

REM Parar processos
taskkill /f /im BancaNoPonto.exe 2>nul

REM Remover atalhos
echo Removendo atalhos...
del "%USERPROFILE%\\Desktop\\Banca no Ponto.lnk" 2>nul
del "%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Banca no Ponto.lnk" 2>nul

REM Remover pasta do programa
echo Removendo arquivos...
rmdir /s /q "%PROGRAMFILES%\\BancaNoPonto" 2>nul

echo.
echo ========================================
echo DESINSTALAÇÃO CONCLUÍDA!
echo ========================================
echo.
echo O Banca no Ponto foi removido do seu computador.
echo.
echo Pressione qualquer tecla para sair...
pause >nul
`;

fs.writeFileSync(path.join(distPath, 'uninstall.bat'), uninstallerScript);

console.log('✅ Scripts de instalação criados!');
console.log('');
console.log('📦 Para criar o instalador completo:');
console.log('1. Execute: npm run pack');
console.log('2. Execute: npm run create-installer');
console.log('3. Distribua a pasta dist para instalação');
console.log('');
console.log('🎯 O usuário final deve:');
console.log('1. Extrair a pasta dist');
console.log('2. Executar install.bat como administrador');
console.log('3. Usar o atalho criado na área de trabalho');
