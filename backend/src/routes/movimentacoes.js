const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

router.get('/', async (_req, res) => {
  try {
    const movimentacoes = await prisma.movimentacao.findMany({
      include: {
        produto: { select: { nome: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(movimentacoes);
  } catch (error) {
    console.error('Erro ao buscar movimentações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { tipo, quantidade, motivo, produtoId } = req.body;
    
    const movimentacao = await prisma.movimentacao.create({
      data: {
        tipo,
        quantidade: parseInt(quantidade),
        motivo,
        produtoId: parseInt(produtoId)
      },
      include: {
        produto: { select: { nome: true } }
      }
    });
    
    if (tipo === 'entrada') {
      await prisma.produto.update({
        where: { id: parseInt(produtoId) },
        data: { estoque: { increment: parseInt(quantidade) } }
      });
    } else if (tipo === 'saida') {
      await prisma.produto.update({
        where: { id: parseInt(produtoId) },
        data: { estoque: { decrement: parseInt(quantidade) } }
      });
    }
    
    res.status(201).json(movimentacao);
  } catch (error) {
    console.error('Erro ao criar movimentação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
