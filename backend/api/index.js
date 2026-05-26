const express = require('express');
const path = require('path');
const fs = require('fs');

// Import o servidor Express do backend
const server = require('../src/server');

// Caminhos
const frontendBuildPath = path.join(__dirname, '../../frontend/build');

// Middleware: Servir arquivos estáticos do frontend com cache
server.use(express.static(frontendBuildPath, {
  maxAge: '1d',
  etag: false
}));

// Rota catch-all para SPA: Se nenhuma rota de API/estático corresponder,
// serve index.html para que o React Router cuide da navegação
server.get('*', (req, res) => {
  const indexPath = path.join(frontendBuildPath, 'index.html');
  
  try {
    if (fs.existsSync(indexPath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ 
        error: 'Frontend not found',
        buildPath: frontendBuildPath 
      });
    }
  } catch (err) {
    console.error('Error serving index.html:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = server;
