const { PrismaClient } = require('@prisma/client');

(async () => {
  // Importante: url relativa a este CWD quando executado a partir da pasta backend.
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: `file:${require('path').resolve('prisma/dev.db')}`,

      },
    },
  });

  try {
    const count = await prisma.produto.count();
    console.log('Produto count:', count);

    const produtos = await prisma.produto.findMany({
      take: 5,
      orderBy: { id: 'asc' },
      select: { id: true, nome: true, estoque: true, preco: true },
    });
    console.log('First 5 produtos:', produtos);

    const produtosApi = await prisma.produto.findMany({
      include: { fornecedor: true },
      orderBy: { nome: 'asc' },
      take: 5,
    });
    console.log('First 5 produtos (with fornecedor):', produtosApi.map(p => ({id:p.id,nome:p.nome,fornecedorId:p.fornecedorId})));

  } finally {
    await prisma.$disconnect();
  }
})().catch((e) => {
  console.error('debug-products error:', e);
  process.exit(1);
});

