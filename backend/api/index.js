const express = require('express');
const path = require('path');
const fs = require('fs');

// Import o servidor Express do backend
const app = require('../src/server');

// Caminhos
const frontendBuildPath = path.join(__dirname, '../../frontend/build');

// Middleware: Servir arquivos estáticos do frontend com cache
// IMPORTANTE: Isto deve ser ANTES do notFoundHandler
app.use(express.static(frontendBuildPath, {
  maxAge: '1d',
  etag: false,
  index: false  // Não servir index.html automaticamente para /
}));

// Rota catch-all para SPA: Se nenhuma rota de API/estático corresponder,
// serve index.html para que o React Router cuide da navegação
// IMPORTANTE: Isto captura ALL e deve estar ANTES de notFoundHandler
app.get('*', (req, res) => {
  const indexPath = path.join(frontendBuildPath, 'index.html');
  
  try {
    if (fs.existsSync(indexPath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.sendFile(indexPath);
    } else {
      console.error('Frontend build not found at:', frontendBuildPath);
      res.status(404).json({ 
        error: 'Frontend not found',
        buildPath: frontendBuildPath 
      });
    }
  } catch (err) {
    console.error('Error serving index.html:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

module.exports = app;
