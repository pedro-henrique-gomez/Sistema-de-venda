const API_URL = process.env.REACT_APP_API_URL || '/api';


// Configuração global de headers
const getHeaders = (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (includeAuth) {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Tratamento centralizado de erros
const handleApiError = (error, customMessage = null) => {
  console.error('API Error:', error);
  
  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;
    
    switch (status) {
      case 401:
        return {
          type: 'auth',
          message: data?.message || 'Não autorizado',
          action: 'login'
        };
      case 403:
        return {
          type: 'permission',
          message: data?.message || 'Acesso negado',
          action: 'contact_admin'
        };
      case 404:
        return {
          type: 'not_found',
          message: data?.message || 'Recurso não encontrado',
          action: 'check_url'
        };
      case 422:
        return {
          type: 'validation',
          message: data?.message || 'Dados inválidos',
          details: data?.details || []
        };
      case 500:
        return {
          type: 'server',
          message: customMessage || data?.message || 'Erro interno do servidor',
          action: 'try_again'
        };
      default:
        return {
          type: 'unknown',
          message: data?.message || customMessage || 'Erro inesperado',
          action: 'contact_support'
        };
    }
  }
  
  return {
    type: 'network',
    message: customMessage || 'Erro de conexão com o servidor',
    action: 'check_connection'
  };
};

// Serviço de API genérico
const apiRequest = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    body = null,
    includeAuth = false,
    customErrorMessage = null,
    timeout = 10000
  } = options;

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: getHeaders(includeAuth),
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(timeout)
    });

    const data = await response.json();

    if (!response.ok) {
      throw { response, data };
    }

    return data;
  } catch (error) {
    throw handleApiError(error, customErrorMessage);
  }
};

// Serviços específicos
const authService = {
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: credentials,
    customErrorMessage: 'Falha na autenticação'
  }),
  
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: userData,
    includeAuth: false,
    customErrorMessage: 'Falha no registro'
  }),
  
  verifyToken: () => apiRequest('/auth/verify', {
    includeAuth: true,
    customErrorMessage: 'Token inválido'
  }),
  
  logout: () => {
    // Logout é apenas remover do localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    return Promise.resolve();
  }
};

const productService = {
  getAll: () => apiRequest('/produtos', { includeAuth: true }),
  create: (data) => apiRequest('/produtos', {
    method: 'POST',
    body: data,
    includeAuth: true,
    customErrorMessage: 'Falha ao criar produto'
  }),
  update: (id, data) => apiRequest(`/produtos/${id}`, {
    method: 'PUT',
    body: data,
    includeAuth: true,
    customErrorMessage: 'Falha ao atualizar produto'
  }),
  delete: (id) => apiRequest(`/produtos/${id}`, {
    method: 'DELETE',
    includeAuth: true,
    customErrorMessage: 'Falha ao excluir produto'
  })
};

export const vendaService = {
  getAll: () => apiRequest('/vendas', { includeAuth: true }),
  create: (data) => apiRequest('/vendas', {
    method: 'POST',
    body: data,
    includeAuth: true,
    customErrorMessage: 'Falha ao registrar venda'
  }),
  getById: (id) => apiRequest(`/vendas/${id}`, {
    includeAuth: true,
    customErrorMessage: 'Falha ao buscar venda'
  }),
  getResumoHoje: () => apiRequest('/vendas/resumo/hoje', {
    includeAuth: true,
    customErrorMessage: 'Falha ao buscar resumo de vendas'
  })
};

export const fornecedorService = {
  getAll: () => apiRequest('/fornecedores', { includeAuth: true }),
  create: (data) => apiRequest('/fornecedores', {
    method: 'POST',
    body: data,
    includeAuth: true,
    customErrorMessage: 'Falha ao criar fornecedor'
  }),
  update: (id, data) => apiRequest(`/fornecedores/${id}`, {
    method: 'PUT',
    body: data,
    includeAuth: true,
    customErrorMessage: 'Falha ao atualizar fornecedor'
  }),
  delete: (id) => apiRequest(`/fornecedores/${id}`, {
    method: 'DELETE',
    includeAuth: true,
    customErrorMessage: 'Falha ao excluir fornecedor'
  })
};

export const movimentacaoService = {
  getAll: () => apiRequest('/movimentacoes', { includeAuth: true }),
  create: (data) => apiRequest('/movimentacoes', {
    method: 'POST',
    body: data,
    includeAuth: true,
    customErrorMessage: 'Falha ao registrar movimentação'
  })
};

export {
  authService,
  productService,
  vendaService,
  fornecedorService,
  movimentacaoService
};
