const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
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

    // Iniciar o backend
    backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: backendPath,
      stdio: 'pipe',
      shell: true
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
      if (data.toString().includes('Server running on port')) {
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('error', (error) => {
      console.error('Failed to start backend:', error);
      reject(error);
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
    });

    // Timeout para caso o backend não inicie
    setTimeout(() => {
      if (backendProcess && !backendProcess.killed) {
        resolve(); // Assume que está funcionando mesmo sem a mensagem exata
      }
    }, 10000);
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
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false,
    titleBarStyle: 'default'
  });

  // Mostrar a janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Carregar o frontend
  if (isDev) {
    // Em desenvolvimento, carregar do servidor de desenvolvimento
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // Em produção, carregar do build estático
    const frontendPath = path.join(__dirname, '../frontend/build/index.html');
    if (fs.existsSync(frontendPath)) {
      mainWindow.loadFile(frontendPath);
    } else {
      // Se não encontrar o build, tentar carregar do servidor local
      setTimeout(() => {
        mainWindow.loadURL('http://localhost:3000');
      }, 3000);
    }
  }

  // Abrir links externos no navegador
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('show-message-box', async (event, options) => {
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

ipcMain.handle('show-error-box', (event, title, content) => {
  dialog.showErrorBox(title, content);
});

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
  // Encerrar o processo do backend ao fechar o aplicativo
  if (backendProcess) {
    console.log('Encerrando backend...');
    backendProcess.kill('SIGTERM');
    
    // Forçar encerramento se não responder em 5 segundos
    setTimeout(() => {
      if (backendProcess && !backendProcess.killed) {
        backendProcess.kill('SIGKILL');
      }
    }, 5000);
  }
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (mainWindow) {
    dialog.showErrorBox('Erro Inesperado', `Ocorreu um erro inesperado: ${error.message}`);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
