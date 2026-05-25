const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

router.get('/', async (_req, res) => {
  try {
    const vendas = await prisma.venda.findMany({
      include: {
        usuario: { select: { nome: true } },
        itens: {
          include: { produto: { select: { nome: true } } }
        },
        taxas: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(vendas);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { total, desconto, usuarioId, itens, formaPagamento } = req.body;
    
    console.log('📦 Dados da venda recebidos:', { total, desconto, formaPagamento, itens, usuarioId });

    // Calcular taxas de pagamento

    const taxasPagamento = {
      dinheiro: 0,
      debito: 0.0167,  // 1.67%
      credito: 0.0389, // 3.89%
      pix: 0
    };
    
    const taxaPagamento = taxasPagamento[formaPagamento] || 0;
    const valorTaxaPagamento = parseFloat(total) * taxaPagamento;
    
    // === Removida dependência de usuarioId (FK pode falhar sem usuário) ===
    // Mantemos o campo para compatibilidade, mas se vier inválido ou não existir,
    // salvamos como "operador padrão".
    let usuarioIdInt = null;
    if (usuarioId !== undefined && usuarioId !== null) {
      const parsed = parseInt(usuarioId, 10);
      if (Number.isFinite(parsed) && parsed > 0) usuarioIdInt = parsed;
    }

    // fallback: pega o primeiro usuário existente
    if (!usuarioIdInt) {
      const primeiroUsuario = await prisma.usuario.findFirst({ select: { id: true } });
      if (primeiroUsuario?.id) usuarioIdInt = primeiroUsuario.id;
    } else {
      const usuarioExiste = await prisma.usuario.findUnique({
        where: { id: usuarioIdInt },
        select: { id: true }
      });
      if (!usuarioExiste) {
        const primeiroUsuario = await prisma.usuario.findFirst({ select: { id: true } });
        if (primeiroUsuario?.id) usuarioIdInt = primeiroUsuario.id;
      }
    }

    if (!usuarioIdInt) {
      // Não há nenhum usuário no banco; nesse caso, não dá para salvar FK.
      return res.status(400).json({
        error: 'Não é possível criar a venda: nenhum usuário encontrado no banco.'
      });
    }


    // Buscar produtos com fornecedores para calcular comissões
    const produtosIds = itens.map(item => item.id);

    const produtosComFornecedores = await prisma.produto.findMany({
      where: { id: { in: produtosIds } },
      include: { fornecedor: true }
    });
    
    console.log('🏭 Produtos com fornecedores:', produtosComFornecedores);
    
    // Calcular comissões de fornecedores
    let totalComissoesFornecedores = 0;
    const comissoesFornecedores = [];
    
    for (const item of itens) {
      const produtoCompleto = produtosComFornecedores.find(p => p.id === item.id);
      if (produtoCompleto && produtoCompleto.fornecedor) {
        const valorItem = parseFloat(item.preco) * parseInt(item.quantidade);
        const comissaoPercentual = produtoCompleto.fornecedor.porcentagem || 0;
        const valorComissao = valorItem * (comissaoPercentual / 100);
        
        totalComissoesFornecedores += valorComissao;
        
        if (comissaoPercentual > 0) {
          comissoesFornecedores.push({
            nome: `Comissão ${produtoCompleto.fornecedor.nome}`,
            valor: valorComissao,
            fornecedorId: produtoCompleto.fornecedor.id,
            produtoId: produtoCompleto.id
          });
        }
      }
    }
    
    // Criar array de taxas para salvar
    const taxasParaSalvar = [];
    
    // Adicionar taxa de pagamento se houver
    if (valorTaxaPagamento > 0) {
      taxasParaSalvar.push({
        nome: `Taxa ${formaPagamento.charAt(0).toUpperCase() + formaPagamento.slice(1)}`,
        valor: valorTaxaPagamento
      });
    }
    
    // Adicionar comissões de fornecedores
    taxasParaSalvar.push(...comissoesFornecedores);
    
    console.log('💰 Taxas calculadas:', {
      taxaPagamento: valorTaxaPagamento,
      comissoesFornecedores: totalComissoesFornecedores,
      totalTaxas: valorTaxaPagamento + totalComissoesFornecedores
    });

    // Calcular faturamento e lucro antes de criar a venda
    const faturamento = parseFloat(total) - valorTaxaPagamento;
    const lucro = faturamento - totalComissoesFornecedores;

    const venda = await prisma.venda.create({
      data: {
        total: parseFloat(total),
        desconto: parseFloat(desconto || 0),
        finalizado: true,
        formaPagamento: formaPagamento,
        lucro: lucro,
        usuarioId: usuarioIdInt,
        itens: {
          create: itens.map(item => ({
            quantidade: parseInt(item.quantidade),
            preco: parseFloat(item.preco),
            produtoId: parseInt(item.id)
          }))
        },
        taxas: taxasParaSalvar.length > 0 ? {
          create: taxasParaSalvar.map(taxa => ({
            nome: taxa.nome,
            valor: parseFloat(taxa.valor)
          }))
        } : undefined
      },
      include: {
        itens: { include: { produto: { include: { fornecedor: true } } } },
        taxas: true,
        usuario: { select: { nome: true } }
      }
    });

    // Atualizar estoque dos produtos vendidos
    console.log('🔄 Atualizando estoque dos produtos vendidos...');
    for (const item of itens) {
      const produtoAtual = await prisma.produto.findUnique({
        where: { id: parseInt(item.id) }
      });
      console.log(`📦 Produto: ${produtoAtual?.nome}, Estoque atual: ${produtoAtual?.estoque}, Quantidade vendida: ${item.quantidade}`);

      await prisma.produto.update({
        where: { id: parseInt(item.id) },
        data: {
          estoque: {
            decrement: parseInt(item.quantidade)
          }
        }
      });

      const produtoAtualizado = await prisma.produto.findUnique({
        where: { id: parseInt(item.id) }
      });
      console.log(`✅ Estoque atualizado: ${produtoAtualizado?.estoque}`);
    }

    // Calcular valores finais separando faturamento e lucro
    const totalTaxas = taxasParaSalvar.reduce((sum, taxa) => sum + taxa.valor, 0);
    
    const quantidadeItensTotal = itens.reduce((s, item) => s + parseInt(item.quantidade || 0), 0);

    console.log(' Resumo financeiro da venda:', {
      totalBruto: parseFloat(total),
      taxaPagamento: valorTaxaPagamento,
      comissoesFornecedores: totalComissoesFornecedores,
      faturamento: faturamento,
      lucro: lucro,
      quantidadeItens: quantidadeItensTotal
    });
    
    res.status(201).json({
      ...venda,
      resumoFinanceiro: {
        totalBruto: parseFloat(total),
        taxaPagamento: valorTaxaPagamento,
        comissoesFornecedores: totalComissoesFornecedores,
        faturamento: faturamento,
        lucro: lucro,
        detalhesTaxas: taxasParaSalvar
      }
    });
  } catch (error) {
    console.error('❌ Erro ao criar venda:', error);
    console.error('📋 Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const venda = await prisma.venda.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuario: { select: { nome: true } },
        itens: {
          include: { produto: true }
        },
        taxas: true
      }
    });
    
    if (!venda) {
      return res.status(404).json({ error: 'Venda não encontrada' });
    }
    
    res.json(venda);
  } catch (error) {
    console.error('Erro ao buscar venda:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar totais por forma de pagamento (para fechamento de caixa)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🗑️ Cancelando venda ID:', id);
    
    // Buscar a venda com seus itens
    const venda = await prisma.venda.findUnique({
      where: { id: parseInt(id) },
      include: {
        itens: {
          include: { produto: true }
        },
        taxas: true
      }
    });
    
    if (!venda) {
      console.log('❌ Venda não encontrada:', id);
      return res.status(404).json({ error: 'Venda não encontrada' });
    }
    
    console.log('📦 Restaurando estoque dos produtos...');
    
    // Restaurar estoque de cada produto
    for (const item of venda.itens) {
      const produtoAtual = await prisma.produto.findUnique({
        where: { id: item.produtoId }
      });
      
      console.log(`📦 Produto: ${produtoAtual?.nome}, Estoque atual: ${produtoAtual?.estoque}, Quantidade a restaurar: ${item.quantidade}`);
      
      await prisma.produto.update({
        where: { id: item.produtoId },
        data: {
          estoque: {
            increment: item.quantidade
          }
        }
      });
      
      const produtoAtualizado = await prisma.produto.findUnique({
        where: { id: item.produtoId }
      });
      console.log(`✅ Estoque restaurado: ${produtoAtualizado?.estoque}`);
    }
    
    // Deletar itens da venda
    console.log('🗑️ Deletando itens da venda...');
    await prisma.itemVenda.deleteMany({
      where: { vendaId: parseInt(id) }
    });
    
    // Deletar taxas da venda
    console.log('🗑️ Deletando taxas da venda...');
    await prisma.taxa.deleteMany({
      where: { vendaId: parseInt(id) }
    });
    
    // Deletar a venda
    console.log('🗑️ Deletando a venda...');
    await prisma.venda.delete({
      where: { id: parseInt(id) }
    });
    
    console.log('✅ Venda cancelada com sucesso:', id);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Erro ao cancelar venda:', error);
    console.error('📋 Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

router.get('/resumo/hoje', async (req, res) => {
  try {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    console.log('🔍 Buscando vendas de hoje para fechamento de caixa:', { hoje, amanha });

    const vendasHoje = await prisma.venda.findMany({
      where: {
        createdAt: {
          gte: hoje,
          lt: amanha
        }
      },
      include: {
        itens: {
          include: { produto: true }
        },
        taxas: true,
        usuario: { select: { nome: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('📊 Vendas encontradas:', vendasHoje.length);

    // Calcular totais por forma de pagamento
    const resumoPorPagamento = {
      dinheiro: { total: 0, quantidade: 0, vendas: [] },
      pix: { total: 0, quantidade: 0, vendas: [] },
      debito: { total: 0, quantidade: 0, vendas: [] },
      credito: { total: 0, quantidade: 0, vendas: [] }
    };

    let totalGeral = 0;
    let totalTaxas = 0;
    let totalComissoes = 0;
    let totalLucro = 0;

    vendasHoje.forEach(venda => {
      // Inferir forma de pagamento pelas taxas
      let formaPagamento = 'dinheiro'; // padrão
      
      if (venda.taxas && venda.taxas.length > 0) {
        const taxaPagamento = venda.taxas.find(taxa => 
          taxa.nome.includes('Taxa Débito') || 
          taxa.nome.includes('Taxa Crédito') || 
          taxa.nome.includes('Taxa Pix')
        );
        
        if (taxaPagamento) {
          if (taxaPagamento.nome.includes('Débito')) formaPagamento = 'debito';
          else if (taxaPagamento.nome.includes('Crédito')) formaPagamento = 'credito';
          else if (taxaPagamento.nome.includes('Pix')) formaPagamento = 'pix';
        }
      }

      // Calcular valores específicos da venda
      const taxaPagamentoValor = (venda.taxas && Array.isArray(venda.taxas))
        ? venda.taxas
          .filter(t => t.nome.includes('Taxa'))
          .reduce((sum, t) => sum + t.valor, 0)
        : 0;
      
      const comissoesValor = (venda.taxas && Array.isArray(venda.taxas))
        ? venda.taxas
          .filter(t => t.nome.includes('Comissão'))
          .reduce((sum, t) => sum + t.valor, 0)
        : 0;
      
      const faturamento = venda.total - taxaPagamentoValor;
      const lucro = faturamento - comissoesValor;

      const quantidadeItensVenda = venda.itens?.reduce((s, it) => s + (it.quantidade || 0), 0) || 0;

      // Adicionar ao resumo por pagamento
      resumoPorPagamento[formaPagamento].total += venda.total;
      resumoPorPagamento[formaPagamento].quantidade += quantidadeItensVenda;
      resumoPorPagamento[formaPagamento].vendas.push({
        id: venda.id,
        total: venda.total,
        horario: venda.createdAt.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        operador: venda.usuario?.nome || 'Sistema',
        faturamento: faturamento,
        lucro: lucro
      });

      // Totais gerais
      totalGeral += venda.total;
      totalTaxas += taxaPagamentoValor;
      totalComissoes += comissoesValor;
      totalLucro += lucro;
    });

    const resumoCompleto = {
      data: hoje.toLocaleDateString('pt-BR'),
      periodo: {
        inicio: hoje.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        fim: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      },
      totais: {
        geral: totalGeral,
        taxas: totalTaxas,
        comissoes: totalComissoes,
        faturamento: totalGeral - totalTaxas,
        lucro: totalLucro,
        quantidadeVendas: vendasHoje.length
      },
      porPagamento: resumoPorPagamento,
      vendas: vendasHoje
    };

    console.log('📋 Resumo de caixa gerado:', {
      totalGeral,
      quantidadeVendas: vendasHoje.length,
      dinheiro: resumoPorPagamento.dinheiro.quantidade,
      pix: resumoPorPagamento.pix.quantidade,
      cartao: resumoPorPagamento.debito.quantidade + resumoPorPagamento.credito.quantidade
    });

    res.json(resumoCompleto);
  } catch (error) {
    console.error('❌ Erro ao buscar resumo de caixa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

