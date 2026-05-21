const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

router.get('/', async (_req, res) => {
  try {
    const taxas = await prisma.taxa.findMany({
      orderBy: { nome: 'asc' }
    });
    res.json(taxas);
  } catch (error) {
    console.error('Erro ao buscar taxas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome, valor } = req.body;
    
    const taxa = await prisma.taxa.create({
      data: {
        nome,
        valor: parseFloat(valor)
      }
    });
    
    res.status(201).json(taxa);
  } catch (error) {
    console.error('Erro ao criar taxa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.taxa.delete({
      where: { id: parseInt(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Erro ao deletar taxa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
