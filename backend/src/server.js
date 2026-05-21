const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Importar middlewares
const { errorHandler, notFoundHandler, requestLogger } = require('./middleware/errorHandler');

// Importar rotas
const produtosRoutes = require('./routes/produtos');
const vendasRoutes = require('./routes/vendas');
const authRoutes = require('./routes/auth');
const authEnhancedRoutes = require('./routes/authEnhanced');
const fornecedoresRoutes = require('./routes/fornecedores');
const movimentacoesRoutes = require('./routes/movimentacoes');
const taxasRoutes = require('./routes/taxas');

const app = express();

const allowedOrigins = new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:55213',
  'http://127.0.0.1:55213'
]);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  // Em dev, liberar para evitar bloqueios durante testes (evita CORS quebrando o frontend local).
  if ((process.env.NODE_ENV || 'development') !== 'production') return true;

  if (allowedOrigins.has(origin)) return true;
  if (/^https:\/\/.*\.vercel\.app$/i.test(origin)) return true;
  if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return true;
  return false;
};

// Middlewares de segurança e logging
app.use(helmet());
app.use(requestLogger);
app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    // Quando não permitido, desabilitar CORS sem lançar erro.
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rota de health check
app.get('/health', (_req, res) => res.json({
  ok: true,
  timestamp: new Date().toISOString(),
  version: '2.0.0',
  environment: process.env.NODE_ENV || 'development'
}));

// Rotas da API
app.use('/api/auth', authRoutes); // Legacy routes
app.use('/api/auth', authEnhancedRoutes); // Enhanced auth with JWT
app.use('/api/produtos', produtosRoutes);
app.use('/api/vendas', vendasRoutes);
app.use('/api/fornecedores', fornecedoresRoutes);
app.use('/api/movimentacoes', movimentacoesRoutes);
app.use('/api/taxas', taxasRoutes);

// Middleware para rotas não encontradas
app.use('*', notFoundHandler);

// Middleware centralizado de erros
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
  console.log(`
🚀 ========================================
     BANCA NO PONTO - BACKEND v2.0.0
========================================
📡 Servidor rodando em: http://localhost:${PORT}
🔐 Autenticação JWT: ATIVADA
📊 Banco de dados: Postgres (DATABASE_URL)
🌍 Ambiente: ${process.env.NODE_ENV || 'development'}
⏰ Iniciado em: ${new Date().toLocaleString('pt-BR')}
========================================
    `);
  });
}

module.exports = app;
