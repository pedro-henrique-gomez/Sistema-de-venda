/*
  Script: importSqliteToSupabase.js

  Objetivo:
  - Ler dados do SQLite local (dev.db) que já existe em ./prisma/dev.db
  - Inserir no Postgres do Supabase via Prisma

  OBS:
  - Este repo usa Prisma com PostgreSQL. Para ler SQLite, usamos a lib 'better-sqlite3'.
  - Se você não quiser instalar dependências, dá para adaptar usando sqlite3, mas isso precisa ser feito aqui.

  Como rodar (no backend/):
  1) Configure DATABASE_URL e DIRECT_URL no ambiente (as mesmas do Supabase).
  2) Rode: npm install better-sqlite3
  3) Rode: node scripts/importSqliteToSupabase.js
*/

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SQLITE_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');

const ensureExists = (p) => {
  if (!fs.existsSync(p)) {
    throw new Error(`SQLite não encontrado em: ${p}`);
  }
};

// Helpers
const toNumberOrNull = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return v;
  if (typeof v === 'string' && v.trim() === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

const main = async () => {
  ensureExists(SQLITE_PATH);

  // Conectar SQLite
  const sqlite = new Database(SQLITE_PATH, { readonly: true });

  // Map de tabelas Prisma ↔ SQLite
  // Atenção: o schema do dev.db criado pelo migration.sql usa nomes de tabelas em PascalCase.
  const SQLITE_TABLES = {
    Usuario: 'Usuario',
    Fornecedor: 'Fornecedor',
    Produto: 'Produto',
    Venda: 'Venda',
    ItemVenda: 'ItemVenda',
    Movimentacao: 'Movimentacao',
    Taxa: 'Taxa'
  };

  console.log('✅ Conectado ao SQLite:', SQLITE_PATH);

  // Importa na ordem que respeita FK
  // (Fornecedor -> Produto -> Usuario -> Venda -> ItemVenda/Taxa -> Movimentacao)

  // 1) Fornecedor
  const fornecedores = sqlite.prepare(`SELECT * FROM ${SQLITE_TABLES.Fornecedor};`).all();
  console.log('Fornecedores (SQLite):', fornecedores.length);

  // Fornecedor.cnpj é unique (nullable). O SQLite pode ter vários registros com cnpj NULL.
  // No Postgres, upsert usando where: { cnpj: null } falha e/ou causa colisão.
  // Regra:
  // - se cnpj existe: upsert por cnpj
  // - se cnpj é null: usa id (PK) como identificador
  for (const f of fornecedores) {
    const cnpj = f.cnpj === null ? null : String(f.cnpj);

    if (cnpj) {
      await prisma.fornecedor.upsert({
        where: { cnpj },
        update: {
          nome: f.nome,
          cnpj,
          telefone: f.telefone,
          email: f.email,
          endereco: f.endereco,
          porcentagem: f.porcentagem
        },
        create: {
          id: f.id,
          nome: f.nome,
          cnpj,
          telefone: f.telefone,
          email: f.email,
          endereco: f.endereco,
          porcentagem: f.porcentagem
        }
      });
    } else {
      // id é PK, então esse upsert é seguro para registros sem cnpj
      await prisma.fornecedor.upsert({
        where: { id: f.id },
        update: {
          nome: f.nome,
          cnpj: null,
          telefone: f.telefone,
          email: f.email,
          endereco: f.endereco,
          porcentagem: f.porcentagem
        },
        create: {
          id: f.id,
          nome: f.nome,
          cnpj: null,
          telefone: f.telefone,
          email: f.email,
          endereco: f.endereco,
          porcentagem: f.porcentagem
        }
      });
    }
  }


  // 2) Produto
  const produtos = sqlite.prepare(`SELECT * FROM ${SQLITE_TABLES.Produto};`).all();
  console.log('Produtos (SQLite):', produtos.length);

  for (const p of produtos) {
    // codigoBarras é unique (nullable).
    // SQLite pode conter múltiplos registros com codigoBarras = NULL.
    // Regra:
    // - se codigoBarras existe: upsert por codigoBarras
    // - se codigoBarras é null: usa id (PK)
    const codigoBarras = p.codigoBarras === null ? null : String(p.codigoBarras);

    if (codigoBarras) {
      await prisma.produto.upsert({
        where: { codigoBarras },
        update: {
          nome: p.nome,
          descricao: p.descricao,
          preco: p.preco,
          estoque: p.estoque,
          codigoBarras,
          fornecedorId: p.fornecedorId
        },
        create: {
          id: p.id,
          nome: p.nome,
          descricao: p.descricao,
          preco: p.preco,
          estoque: p.estoque,
          codigoBarras,
          fornecedorId: p.fornecedorId
        }
      });
    } else {
      await prisma.produto.upsert({
        where: { id: p.id },
        update: {
          nome: p.nome,
          descricao: p.descricao,
          preco: p.preco,
          estoque: p.estoque,
          codigoBarras: null,
          fornecedorId: p.fornecedorId
        },
        create: {
          id: p.id,
          nome: p.nome,
          descricao: p.descricao,
          preco: p.preco,
          estoque: p.estoque,
          codigoBarras: null,
          fornecedorId: p.fornecedorId
        }
      });
    }
  }


  // 3) Usuario
  const usuarios = sqlite.prepare(`SELECT * FROM ${SQLITE_TABLES.Usuario};`).all();
  console.log('Usuarios (SQLite):', usuarios.length);

  for (const u of usuarios) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: {
        nome: u.nome,
        email: u.email,
        senha: u.senha
      },
      create: {
        id: u.id,
        nome: u.nome,
        email: u.email,
        senha: u.senha
      }
    });
  }

  // 4) Venda
  const vendas = sqlite.prepare(`SELECT * FROM ${SQLITE_TABLES.Venda};`).all();
  console.log('Vendas (SQLite):', vendas.length);

  for (const v of vendas) {
    await prisma.venda.upsert({
      where: { id: v.id },
      update: {
        total: v.total,
        desconto: v.desconto,
        finalizado: v.finalizado === 1 || v.finalizado === true,
        formaPagamento: v.formaPagamento,
        lucro: v.lucro,
        usuarioId: v.usuarioId
      },
      create: {
        id: v.id,
        total: v.total,
        desconto: v.desconto,
        finalizado: v.finalizado === 1 || v.finalizado === true,
        formaPagamento: v.formaPagamento,
        lucro: v.lucro,
        usuarioId: v.usuarioId
      }
    });
  }

  // 5) ItemVenda
  const itens = sqlite.prepare(`SELECT * FROM ${SQLITE_TABLES.ItemVenda};`).all();
  console.log('ItemVenda (SQLite):', itens.length);

  for (const it of itens) {
    await prisma.itemVenda.upsert({
      where: { id: it.id },
      update: {
        quantidade: it.quantidade,
        preco: it.preco,
        vendaId: it.vendaId,
        produtoId: it.produtoId
      },
      create: {
        id: it.id,
        quantidade: it.quantidade,
        preco: it.preco,
        vendaId: it.vendaId,
        produtoId: it.produtoId
      }
    });
  }

  // 6) Taxa
  const taxas = sqlite.prepare(`SELECT * FROM ${SQLITE_TABLES.Taxa};`).all();
  console.log('Taxas (SQLite):', taxas.length);

  for (const t of taxas) {
    await prisma.taxa.upsert({
      where: { id: t.id },
      update: {
        nome: t.nome,
        valor: t.valor,
        vendaId: t.vendaId
      },
      create: {
        id: t.id,
        nome: t.nome,
        valor: t.valor,
        vendaId: t.vendaId
      }
    });
  }

  // 7) Movimentacao
  const movs = sqlite.prepare(`SELECT * FROM ${SQLITE_TABLES.Movimentacao};`).all();
  console.log('Movimentacao (SQLite):', movs.length);

  for (const m of movs) {
    await prisma.movimentacao.upsert({
      where: { id: m.id },
      update: {
        tipo: m.tipo,
        quantidade: m.quantidade,
        motivo: m.motivo,
        produtoId: m.produtoId
      },
      create: {
        id: m.id,
        tipo: m.tipo,
        quantidade: m.quantidade,
        motivo: m.motivo,
        produtoId: m.produtoId
      }
    });
  }

  console.log('🎉 Importação concluída com sucesso.');
};

main()
  .catch((err) => {
    console.error('❌ Erro na importação:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

