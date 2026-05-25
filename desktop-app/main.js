const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;
const isDev = process.argv.includes('--dev');

// Função para iniciar o backend
function startBackend() {
  return new Promise((resolve, reject) => {
    const backendPath = path.join(__dirname, '../backend');
    
    console.log('Iniciando backend...');
    
    // Verificar se o backend existe
    if (!fs.existsSync(backendPath)) {
      reject(new Error('Pasta do backend não encontrada'));
      return;
    }

    // Verificar se node_modules existe
    const nodeModulesPath = path.join(backendPath, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.log('Instalando dependências do backend...');
      const npmInstall = spawn('npm', ['install'], {
        cwd: backendPath,
        stdio: 'pipe',
        shell: true
      });

      npmInstall.on('close', (code) => {
        if (code !== 0) {
          reject(new Error('Falha ao instalar dependências'));
          return;
        }
        startBackendProcess();
      });

      npmInstall.on('error', reject);
    } else {
      startBackendProcess();
    }

    function startBackendProcess() {
      backendProcess = spawn('npm', ['run', 'dev'], {
        cwd: backendPath,
        stdio: 'pipe',
        shell: true
      });

      let output = '';
      
      backendProcess.stdout.on('data', (data) => {
        output += data.toString();
        console.log(`Backend: ${data}`);
        
        if (output.includes('Server running on port') || 
            output.includes('listening on port') ||
            output.includes('3001')) {
          resolve();
        }
      });

      backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
        output += data.toString();
      });

      backendProcess.on('error', (error) => {
        console.error('Failed to start backend:', error);
        reject(error);
      });

      backendProcess.on('close', (code) => {
        console.log(`Backend process exited with code ${code}`);
      });

      // Timeout
      setTimeout(() => {
        if (backendProcess && !backendProcess.killed) {
          resolve(); // Assume que está funcionando
        }
      }, 10000);
    }
  });
}

// Função para criar a janela principal
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // Permitir carregar recursos locais
    },
    icon: path.join(__dirname, 'icon.png'),
    show: false,
    title: 'Banca no Ponto - Sistema de Vendas'
  });

  // Mostrar loading primeiro
  mainWindow.loadFile(path.join(__dirname, 'loading.html'));

  // Esperar um pouco e depois carregar o app
  setTimeout(() => {
    if (isDev) {
      // Em desenvolvimento, carregar do servidor
      mainWindow.loadURL('http://localhost:3000');
    } else {
      // Em produção, servir o frontend estático
      serveAndLoadFrontend();
    }
  }, 2000);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Servir frontend estático
function serveAndLoadFrontend() {
  const express = require('express');
  const frontendApp = express();
  const frontendPath = path.join(__dirname, '../frontend/build');

  if (fs.existsSync(frontendPath)) {
    frontendApp.use(express.static(frontendPath));
    
    frontendApp.get('*', (req, res) => {
      res.sendFile(path.join(frontendPath, 'index.html'));
    });

    const server = frontendApp.listen(3000, () => {
      console.log('Frontend server rodando na porta 3000');
      mainWindow.loadURL('http://localhost:3000');
    });

    // Salvar referência do servidor para fechar depois
    mainWindow.frontendServer = server;
  } else {
    // Se não tiver build, tentar carregar do servidor de desenvolvimento
    mainWindow.loadURL('http://localhost:3000');
  }
}

// Eventos do aplicativo
app.whenReady().then(async () => {
  try {
    // Iniciar o backend primeiro
    await startBackend();
    
    // Criar a janela principal
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });

  } catch (error) {
    console.error('Erro ao iniciar aplicativo:', error);
    dialog.showErrorBox('Erro de Inicialização', `Não foi possível iniciar o backend: ${error.message}`);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Encerrar processos
  if (backendProcess) {
    console.log('Encerrando backend...');
    backendProcess.kill('SIGTERM');
  }
  
  if (mainWindow && mainWindow.frontendServer) {
    mainWindow.frontendServer.close();
  }
});

// Tratamento de erros
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (mainWindow) {
    dialog.showErrorBox('Erro Inesperado', `Ocorreu um erro: ${error.message}`);
  }
});
