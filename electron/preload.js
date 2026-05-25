const { contextBridge, ipcRenderer } = require('electron');

// Expor APIs seguras para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Informações do aplicativo
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Diálogos
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  showErrorBox: (title, content) => ipcRenderer.invoke('show-error-box', title, content),
  
  // Informações do sistema
  platform: process.platform,
  
  // Utilidades
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});

// Sobrescrever o console para logs também aparecerem no processo principal
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
  originalLog(...args);
  ipcRenderer.send('console-log', args);
};

console.error = (...args) => {
  originalError(...args);
  ipcRenderer.send('console-error', args);
};

console.warn = (...args) => {
  originalWarn(...args);
  ipcRenderer.send('console-warn', args);
};
