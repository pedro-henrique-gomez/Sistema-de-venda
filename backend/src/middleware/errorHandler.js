// Middleware centralizado de tratamento de erros
const errorHandler = (err, req, res, next) => {
  console.error('🚨 ERRO DETECTADO:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress
  });

  // Erros de validação do Prisma
  if (err.code === 'P2002') {
    return res.status(400).json({
      error: 'Dados duplicados',
      message: 'Já existe um registro com estes dados',
      details: err.meta?.target || 'unknown'
    });
  }

  // Erros de chave estrangeira do Prisma
  if (err.code === 'P2003') {
    return res.status(400).json({
      error: 'Relacionamento inválido',
      message: 'Referência a registro não existe',
      details: err.meta?.field_name || 'unknown'
    });
  }

  // Erros de registro não encontrado do Prisma
  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Registro não encontrado',
      message: 'O registro solicitado não existe',
      details: err.meta?.model_name || 'unknown'
    });
  }

  // Erros de sintaxe JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      message: 'Token de autenticação inválido ou malformado'
    });
  }

  // Erros de expiração JWT
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      message: 'Seu token de acesso expirou. Faça login novamente'
    });
  }

  // Erros de validação de dados
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      message: 'Os dados fornecidos são inválidos',
      details: err.details
    });
  }

  // Erros de conexão com banco
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return res.status(503).json({
      error: 'Serviço indisponível',
      message: 'Não foi possível conectar ao banco de dados. Tente novamente em alguns minutos'
    });
  }

  // Erro padrão para status 500
  const statusCode = res.statusCode || 500;
  res.status(statusCode).json({
    error: 'Erro interno do servidor',
    message: 'Ocorreu um erro inesperado. Tente novamente',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.message 
    })
  });
};

// Middleware para rotas não encontradas (404)
const notFoundHandler = (req, res) => {
  console.warn('🔍 ROTA NÃO ENCONTRADA:', {
    url: req.url,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString()
  });

  res.status(404).json({
    error: 'Recurso não encontrado',
    message: `A rota ${req.method} ${req.url} não existe`,
    availableRoutes: [
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/verify',
      'GET /api/auth/usuarios',
      'PUT /api/auth/usuarios/:id',
      'GET /api/produtos',
      'POST /api/produtos',
      'PUT /api/produtos/:id',
      'DELETE /api/produtos/:id',
      'GET /api/vendas',
      'POST /api/vendas',
      'GET /api/vendas/:id',
      'GET /api/vendas/resumo/hoje',
      'GET /api/fornecedores',
      'POST /api/fornecedores',
      'PUT /api/fornecedores/:id',
      'DELETE /api/fornecedores/:id',
      'GET /api/movimentacoes',
      'POST /api/movimentacoes',
      'GET /api/taxas'
    ]
  });
};

// Middleware para log de requisições (development only)
const requestLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📝 REQUEST:', {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }
  next();
};

module.exports = {
  errorHandler,
  notFoundHandler,
  requestLogger
};
