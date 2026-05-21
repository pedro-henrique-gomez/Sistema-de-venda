const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_aqui_mude_em_producao';

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ 
      error: 'Token não fornecido',
      message: 'É necessário fornecer um token de acesso' 
    });
  }

  const token = authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Token inválido',
      message: 'Formato do token inválido' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ 
        error: 'Token inválido',
        message: 'Token expirado ou inválido' 
      });
    }

    // Adicionar informações do usuário ao request
    req.usuario = decoded;
    next();
  });
};

// Middleware para verificar se usuário é admin
const requireAdmin = (req, res, next) => {
  if (!req.usuario || req.usuario.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Apenas administradores podem acessar esta função' 
    });
  }
  next();
};

// Gerar token JWT
const generateToken = (usuario) => {
  return jwt.sign(
    { 
      id: usuario.id, 
      nome: usuario.nome, 
      email: usuario.email,
      role: usuario.role || 'operador'
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Verificar senha com bcrypt
const verifyPassword = async (password, hashedPassword) => {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
  authenticateToken,
  requireAdmin,
  generateToken,
  verifyPassword
};
