const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build do aplicativo desktop Banca no Ponto...\n');

// 1. Build do frontend
console.log('📦 Build do frontend React...');
try {
  process.chdir('./frontend');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Frontend build concluído!\n');
} catch (error) {
  console.error('❌ Erro no build do frontend:', error.message);
  process.exit(1);
}

// 2. Instalar dependências do Electron
console.log('📦 Instalando dependências do Electron...');
try {
  process.chdir('../electron');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependências do Electron instaladas!\n');
} catch (error) {
  console.error('❌ Erro ao instalar dependências do Electron:', error.message);
  process.exit(1);
}

// 3. Empacotar aplicativo desktop
console.log('🏗️ Empacotando aplicativo desktop...');
try {
  execSync('npm run pack', { stdio: 'inherit' });
  console.log('✅ Aplicativo empacotado com sucesso!\n');
} catch (error) {
  console.error('❌ Erro ao empacotar aplicativo:', error.message);
  process.exit(1);
}

// 4. Criar instalador
console.log('📦 Criando scripts de instalação...');
try {
  execSync('npm run create-installer', { stdio: 'inherit' });
  console.log('✅ Scripts de instalação criados!\n');
} catch (error) {
  console.error('❌ Erro ao criar scripts de instalação:', error.message);
  process.exit(1);
}

console.log('🎉 Build concluído com sucesso!');
console.log('📁 O aplicativo está na pasta: ./electron/dist');
console.log('\n📋 Próximos passos:');
console.log('1. Vá para a pasta: ./electron/dist');
console.log('2. Extraia o arquivo para o computador destino');
console.log('3. Execute install.bat como administrador');
console.log('4. Use o atalho "Banca no Ponto" na área de trabalho');
console.log('\n✨ Seu sistema agora é um aplicativo desktop profissional!');
