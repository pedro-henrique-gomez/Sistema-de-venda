const { z } = require('zod');

// Schemas de validação com Zod
const schemas = {
  // Validação para login/registro de usuário
  usuario: z.object({
    nome: z.string()
      .min(3, 'Nome deve ter pelo menos 3 caracteres')
      .max(100, 'Nome deve ter no máximo 100 caracteres')
      .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
    email: z.string()
      .email('Email inválido')
      .max(255, 'Email deve ter no máximo 255 caracteres'),
    senha: z.string()
      .min(6, 'Senha deve ter pelo menos 6 caracteres')
      .max(100, 'Senha deve ter no máximo 100 caracteres')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter pelo menos 1 letra maiúscula, 1 letra minúscula e 1 número'),
    role: z.enum(['admin', 'operador']).optional().default('operador')
  }),

  // Validação para produtos
  produto: z.object({
    nome: z.string()
      .min(1, 'Nome do produto é obrigatório')
      .max(200, 'Nome deve ter no máximo 200 caracteres'),
    descricao: z.string()
      .max(500, 'Descrição deve ter no máximo 500 caracteres')
      .optional(),
    preco: z.number()
      .positive('Preço deve ser positivo')
      .min(0.01, 'Preço mínimo é R$ 0,01')
      .max(99999.99, 'Preço máximo é R$ 99.999,99'),
    estoque: z.number()
      .int('Estoque deve ser um número inteiro')
      .min(0, 'Estoque não pode ser negativo')
      .max(99999, 'Estoque máximo é 99999'),
    codigoBarras: z.string()
      .max(50, 'Código de barras deve ter no máximo 50 caracteres')
      .optional()
      .nullable(),
    fornecedorId: z.number()
      .int('ID do fornecedor deve ser um número inteiro')
      .positive('ID do fornecedor deve ser positivo')
      .optional()
      .nullable()
  }),

  // Validação para fornecedores
  fornecedor: z.object({
    nome: z.string()
      .min(2, 'Nome do fornecedor é obrigatório')
      .max(100, 'Nome deve ter no máximo 100 caracteres'),
    cnpj: z.string()
      .max(20, 'CNPJ deve ter no máximo 20 caracteres')
      .optional()
      .nullable(),
    telefone: z.string()
      .max(20, 'Telefone deve ter no máximo 20 caracteres')
      .optional()
      .nullable(),
    email: z.string()
      .email('Email do fornecedor inválido')
      .max(255, 'Email deve ter no máximo 255 caracteres')
      .optional()
      .nullable(),
    endereco: z.string()
      .max(200, 'Endereço deve ter no máximo 200 caracteres')
      .optional()
      .nullable(),
    porcentagem: z.number()
      .min(0, 'Porcentagem não pode ser negativa')
      .max(100, 'Porcentagem máxima é 100%')
      .optional()
      .default(0)
  }),

  // Validação para vendas
  venda: z.object({
    total: z.number()
      .positive('Total deve ser positivo')
      .min(0.01, 'Total mínimo é R$ 0,01'),
    desconto: z.number()
      .min(0, 'Desconto não pode ser negativo')
      .max(99999.99, 'Desconto máximo é R$ 99.999,99')
      .optional()
      .default(0),
    usuarioId: z.number()
      .int('ID do usuário deve ser um número inteiro')
      .positive('ID do usuário deve ser positivo'),
    itens: z.array(z.object({
      id: z.number().int().positive('ID do produto deve ser positivo'),
      quantidade: z.number().int().positive('Quantidade deve ser positiva'),
      preco: z.number().positive('Preço deve ser positivo')
    })).min(1, 'Pelo menos um item é obrigatório'),
    formaPagamento: z.enum(['dinheiro', 'debito', 'credito', 'pix'])
  }),

  // Validação para movimentações de estoque
  movimentacao: z.object({
    tipo: z.enum(['entrada', 'saida']),
    quantidade: z.number()
      .int('Quantidade deve ser um número inteiro')
      .positive('Quantidade deve ser positiva'),
    motivo: z.string()
      .max(200, 'Motivo deve ter no máximo 200 caracteres')
      .optional()
      .default(''),
    produtoId: z.number()
      .int('ID do produto deve ser um número inteiro')
      .positive('ID do produto deve ser positivo')
  })
};

// Middleware de validação genérico
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = source === 'body' ? req.body : 
                   source === 'query' ? req.query : 
                   source === 'params' ? req.params : req;
      
      const result = schema.safeParse(data);
      
      if (!result.success) {
        const errors = result.error.issues.map(issue => ({
          campo: issue.path.join('.'),
          mensagem: issue.message,
          valor: issue.received
        }));
        
        return res.status(400).json({
          error: 'Dados inválidos',
          message: 'Verifique os dados enviados',
          detalhes: errors
        });
      }
      
      // Adicionar dados validados ao request
      req.validated = result.data;
      next();
    } catch (error) {
      console.error('❌ Erro na validação:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Não foi possível validar os dados'
      });
    }
  };
};

module.exports = {
  schemas,
  validate
};
