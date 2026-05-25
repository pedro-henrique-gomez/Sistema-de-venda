const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateToken, verifyPassword } = require('../middleware/auth');

const prisma = new PrismaClient();

// Validação de dados de entrada
const validateLoginData = (req, res, next) => {
  const { email, senha } = req.body;
  
  if (!email || !senha) {
    return res.status(400).json({
      error: 'Dados incompletos',
      message: 'Email e senha são obrigatórios'
    });
  }
  
  if (!email.includes('@')) {
    return res.status(400).json({
      error: 'Email inválido',
      message: 'Formato de email inválido'
    });
  }
  
  if (senha.length < 6) {
    return res.status(400).json({
      error: 'Senha muito curta',
      message: 'Senha deve ter pelo menos 6 caracteres'
    });
  }
  
  next();
};

// Registro de novo usuário (apenas admin pode criar)
router.post('/register', validateLoginData, async (req, res) => {
  try {
    const { nome, email, senha, role = 'operador' } = req.body;
    
    // Verificar se já existe usuário com este email
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email }
    });
    
    if (usuarioExistente) {
      return res.status(400).json({
        error: 'Email já cadastrado',
        message: 'Já existe uma conta com este email'
      });
    }
    
    // Hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(senha, saltRounds);
    
    // Criar usuário
    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: hashedPassword,
        role: role // 'admin' ou 'operador'
      }
    });
    
    console.log('✅ Usuário criado:', { id: usuario.id, nome, email, role });
    
    // Gerar token automaticamente após registro
    const token = generateToken(usuario);
    
    res.status(201).json({
      message: 'Usuário criado com sucesso',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role
      },
      token
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível criar o usuário'
    });
  }
});

// Login de usuário
router.post('/login', validateLoginData, async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    // Buscar usuário no banco
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });
    
    if (!usuario) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }
    
    // Verificar senha
    const senhaValida = await verifyPassword(senha, usuario.senha);
    
    if (!senhaValida) {
      return res.status(401).json({
        error: 'Credenciais inválidas',
        message: 'Email ou senha incorretos'
      });
    }
    
    // Gerar token JWT
    const token = generateToken(usuario);
    
    console.log('🔐 Login realizado:', { 
      id: usuario.id, 
      nome: usuario.nome, 
      email: usuario.email,
      role: usuario.role 
    });
    
    res.json({
      message: 'Login realizado com sucesso',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role
      },
      token
    });
    
  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível realizar o login'
    });
  }
});

// Verificar token atual
router.get('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ valid: false });
  }
  
  const token = authHeader.split(' ')[1];
  const jwt = require('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_aqui_mude_em_producao';
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ 
      valid: true, 
      usuario: {
        id: decoded.id,
        nome: decoded.nome,
        email: decoded.email,
        role: decoded.role
      }
    });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
});

// Listar todos os usuários (apenas admin)
router.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(usuarios);
  } catch (error) {
    console.error('❌ Erro ao listar usuários:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível listar usuários'
    });
  }
});

// Atualizar usuário (apenas admin)
router.put('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, role } = req.body;
    
    // Verificar se usuário existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!usuarioExistente) {
      return res.status(404).json({
        error: 'Usuário não encontrado',
        message: 'Usuário não encontrado'
      });
    }
    
    // Se email mudou, verificar se não está em uso
    if (email && email !== usuarioExistente.email) {
      const emailEmUso = await prisma.usuario.findUnique({
        where: { email }
      });
      
      if (emailEmUso) {
        return res.status(400).json({
          error: 'Email já em uso',
          message: 'Este email já está sendo usado por outro usuário'
        });
      }
    }
    
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: {
        nome: nome || usuarioExistente.nome,
        email: email || usuarioExistente.email,
        role: role || usuarioExistente.role
      }
    });
    
    console.log('✅ Usuário atualizado:', { id, nome: usuarioAtualizado.nome });
    
    res.json({
      message: 'Usuário atualizado com sucesso',
      usuario: usuarioAtualizado
    });
    
  } catch (error) {
    console.error('❌ Erro ao atualizar usuário:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível atualizar o usuário'
    });
  }
});

module.exports = router;
