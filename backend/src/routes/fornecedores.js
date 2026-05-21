const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

router.get('/', async (_req, res) => {
  try {
    const fornecedores = await prisma.fornecedor.findMany({
      orderBy: { nome: 'asc' }
    });
    res.json(fornecedores);
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome, cnpj, telefone, email, endereco, porcentagem } = req.body;
    
    const fornecedor = await prisma.fornecedor.create({
      data: {
        nome,
        cnpj,
        telefone,
        email,
        endereco,
        porcentagem: porcentagem ? parseFloat(porcentagem) : 0
      }
    });
    
    res.status(201).json(fornecedor);
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cnpj, telefone, email, endereco, porcentagem } = req.body;
    
    const fornecedor = await prisma.fornecedor.update({
      where: { id: parseInt(id) },
      data: {
        nome,
        cnpj,
        telefone,
        email,
        endereco,
        porcentagem: porcentagem ? parseFloat(porcentagem) : 0
      }
    });
    
    res.json(fornecedor);
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.fornecedor.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar fornecedor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
