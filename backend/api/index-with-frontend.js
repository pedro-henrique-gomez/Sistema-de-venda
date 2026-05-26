const express = require('express');
const path = require('path');
const fs = require('fs');
const app = require('../src/server');

const frontendBuildPath = path.join(__dirname, '../../frontend/build');

// Servir arquivos estáticos do frontend
app.use(express.static(frontendBuildPath, {
  maxAge: '1y',
  etag: false
}));

// Servir index.html para rotas SPA que não existem
app.get('*', (req, res) => {
  const indexPath = path.join(frontendBuildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

module.exports = app;
