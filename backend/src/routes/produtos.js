const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validate, schemas } = require('../utils/validation');

const prisma = new PrismaClient();

// Listar produtos (público temporariamente para importação CSV)
router.get('/', async (req, res) => {
  try {
    const produtos = await prisma.produto.findMany({
      include: {
        fornecedor: true
      },
      orderBy: { nome: 'asc' }
    });

    // Debug rápido pra confirmar o payload retornado pela API
    console.log('GET /api/produtos -> total:', produtos.length);

    res.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});


// Criar produto (público temporariamente para importação CSV)
router.post('/', async (req, res) => {
  try {
    const { nome, descricao, preco, estoque, codigoBarras, fornecedorId } = req.body;
    
    console.log('📝 Criando produto:', { nome, descricao, preco, estoque, codigoBarras, fornecedorId });
    
    const produto = await prisma.produto.create({
      data: {
        nome: nome.trim(),
        descricao: descricao?.trim() || '',
        preco: parseFloat(preco),
        estoque: parseInt(estoque),
        codigoBarras: codigoBarras?.trim() || null,
        fornecedorId: fornecedorId ? parseInt(fornecedorId) : null
      }
    });
    
    console.log('✅ Produto criado com sucesso:', produto);
    res.status(201).json(produto);
  } catch (error) {
    console.error('❌ Erro ao criar produto:', error);
    console.error('📋 Stack trace:', error.stack);
    
    // Erros específicos do Prisma
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Nome do produto já existe' });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'ID do fornecedor não existe' });
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// Atualizar produto (público temporariamente)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, preco, estoque, codigoBarras, fornecedorId } = req.body;
    
    const produto = await prisma.produto.update({
      where: { id: parseInt(id) },
      data: {
        nome,
        descricao,
        preco: parseFloat(preco),
        estoque: parseInt(estoque),
        codigoBarras,
        fornecedorId: fornecedorId ? parseInt(fornecedorId) : null
      }
    });
    
    console.log('✅ Produto atualizado:', { id, nome });
    res.json(produto);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    
    // Erros específicos do Prisma
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Código de barras já existe' });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'ID do fornecedor não existe' });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar produto (público temporariamente)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Tentando deletar produto ID:', id);
    
    // Verificar se produto existe e se há registros relacionados
    const produtoExistente = await prisma.produto.findUnique({
      where: { id: parseInt(id) },
      include: {
        itensVenda: true,
        movimentacoes: true
      }
    });
    
    if (!produtoExistente) {
      console.log('❌ Produto não encontrado:', id);
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    if (produtoExistente.itensVenda.length > 0) {
      console.log('❌ Produto possui vendas registradas:', produtoExistente.itensVenda.length);
      return res.status(400).json({ 
        error: 'Produto não pode ser excluído - possui vendas registradas',
        details: `Encontradas ${produtoExistente.itensVenda.length} vendas relacionadas`
      });
    }
    
    if (produtoExistente.movimentacoes.length > 0) {
      console.log('❌ Produto possui movimentações registradas:', produtoExistente.movimentacoes.length);
      return res.status(400).json({ 
        error: 'Produto não pode ser excluído - possui movimentações registradas',
        details: `Encontradas ${produtoExistente.movimentacoes.length} movimentações relacionadas`
      });
    }
    
    console.log('✅ Produto encontrado, deletando:', produtoExistente.nome);
    
    await prisma.produto.delete({
      where: { id: parseInt(id) }
    });
    
    console.log('✅ Produto deletado com sucesso:', id);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Erro ao deletar produto:', error);
    console.error('📋 Stack trace:', error.stack);
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

module.exports = router;

