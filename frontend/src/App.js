import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Usuário do caixa (fallback para compatibilidade com o backend)
// Se no futuro houver autenticação real, este valor deve vir do JWT/session.
const USUARIO_ID_DEFAULT = 1;



function Dashboard({ isMobile }) {
  const [vendas, setVendas] = useState([]);
  const [metrics, setMetrics] = useState({
    totalVendidoHoje: 0,
    lucroHoje: 0,
    debitoHoje: 0,
    creditoHoje: 0,
    pixHoje: 0,
    dinheiroHoje: 0,
    vendasHoje: 0,
    estoqueBaixo: 0
  });

  // Calcular métricas baseadas nas vendas
  useEffect(() => {
    if (vendas.length === 0) {
      setMetrics({
        totalVendidoHoje: 0,
        lucroHoje: 0,
        debitoHoje: 0,
        creditoHoje: 0,
        pixHoje: 0,
        dinheiroHoje: 0,
        vendasHoje: 0,
        estoqueBaixo: 0
      });
      return;
    }

    const hoje = new Date().toISOString().split('T')[0];
    const vendasHoje = vendas.filter(venda => venda.createdAt && venda.createdAt.startsWith(hoje));
    
    const debitoHoje = vendasHoje
      .filter(venda => venda.formaPagamento === 'debito')
      .reduce((sum, venda) => sum + venda.total, 0);
    
    const creditoHoje = vendasHoje
      .filter(venda => venda.formaPagamento === 'credito')
      .reduce((sum, venda) => sum + venda.total, 0);
    
    const pixHoje = vendasHoje
      .filter(venda => venda.formaPagamento === 'pix')
      .reduce((sum, venda) => sum + venda.total, 0);
    
    const dinheiroHoje = vendasHoje
      .filter(venda => venda.formaPagamento === 'dinheiro')
      .reduce((sum, venda) => sum + venda.total, 0);

    const totalVendidoHoje = debitoHoje + creditoHoje + pixHoje + dinheiroHoje;
    const lucroHoje = vendasHoje.reduce((sum, venda) => sum + venda.lucro, 0);

    setMetrics({
      totalVendidoHoje,
      lucroHoje,
      debitoHoje,
      creditoHoje,
      pixHoje,
      dinheiroHoje,
      vendasHoje: vendasHoje.length,
      estoqueBaixo: 3 // Manter valor fixo por enquanto
    });
  }, [vendas]);

  // Estados para relatórios
  const [periodoRelatorio, setPeriodoRelatorio] = useState('hoje');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [mostrarRelatorio, setMostrarRelatorio] = useState(false);

  // Carregar vendas do backend
  useEffect(() => {
    const fetchVendas = async () => {
      try {
        const response = await fetch(`${API_URL}/vendas`);
        const data = await response.json();
        setVendas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Erro ao carregar vendas:', error);
        // Dados mock para fallback com mais dados para relatórios
        setVendas([
          { 
            id: 1, 
            data: new Date().toISOString().split('T')[0], 
            formaPagamento: 'credito', 
            total: 67.00, 
            lucro: 45.50 
          },
          { 
            id: 2, 
            data: new Date().toISOString().split('T')[0], 
            formaPagamento: 'debito', 
            total: 45.00, 
            lucro: 28.20 
          },
          { 
            id: 3, 
            data: new Date().toISOString().split('T')[0], 
            formaPagamento: 'pix', 
            total: 28.50, 
            lucro: 15.50 
          },
          {
            id: 4,
            data: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            formaPagamento: 'credito',
            total: 120.00,
            lucro: 85.00
          },
          {
            id: 5,
            data: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            formaPagamento: 'debito',
            total: 89.50,
            lucro: 62.30
          }
        ]);
      }
    };

    fetchVendas();
  }, []);

  // Funções para relatórios
  const getPeriodoFiltrado = () => {
    const hoje = new Date();
    let inicio, fim;

    switch (periodoRelatorio) {
      case 'hoje':
        inicio = fim = hoje.toISOString().split('T')[0];
        break;
      case 'quinzenal':
        const dia = hoje.getDate();
        if (dia <= 15) {
          inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
          fim = new Date(hoje.getFullYear(), hoje.getMonth(), 15).toISOString().split('T')[0];
        } else {
          inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 16).toISOString().split('T')[0];
          fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
        }
        break;
      case 'mensal':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
        fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'personalizado':
        inicio = dataInicial;
        fim = dataFinal;
        break;
      default:
        inicio = fim = hoje.toISOString().split('T')[0];
    }

    return { inicio, fim };
  };

  const calcularMetricasPeriodo = () => {
    const { inicio, fim } = getPeriodoFiltrado();
    
    const vendasFiltradas = vendas.filter(venda => {
      return venda.data >= inicio && venda.data <= fim;
    });

    const debitoPeriodo = vendasFiltradas
      .filter(venda => venda.formaPagamento === 'debito')
      .reduce((sum, venda) => sum + venda.total, 0);
    
    const creditoPeriodo = vendasFiltradas
      .filter(venda => venda.formaPagamento === 'credito')
      .reduce((sum, venda) => sum + venda.total, 0);
    
    const pixPeriodo = vendasFiltradas
      .filter(venda => venda.formaPagamento === 'pix')
      .reduce((sum, venda) => sum + venda.total, 0);
    
    const dinheiroPeriodo = vendasFiltradas
      .filter(venda => venda.formaPagamento === 'dinheiro')
      .reduce((sum, venda) => sum + venda.total, 0);

    const totalPeriodo = debitoPeriodo + creditoPeriodo + pixPeriodo + dinheiroPeriodo;
    const lucroPeriodo = vendasFiltradas.reduce((sum, venda) => sum + venda.lucro, 0);

    return {
      totalPeriodo,
      lucroPeriodo,
      debitoPeriodo,
      creditoPeriodo,
      pixPeriodo,
      dinheiroPeriodo,
      vendasPeriodo: vendasFiltradas.length,
      vendasFiltradas
    };
  };

  const [produtosPopulares] = useState([
    { nome: 'Jornal Pet', qtd: 8, total: 80.00 },
    { nome: 'Varejo 1,5', qtd: 15, total: 22.50 },
    { nome: 'Trident Tutti Fruti', qtd: 6, total: 21.00 },
    { nome: 'A Tribuna', qtd: 4, total: 10.00 }
  ]);

  const [estoqueBaixo] = useState([
    { nome: 'Trident Tutti Fruti', qtd: 2, categoria: 'Bomboniere' },
    { nome: 'Varejo 1 real', qtd: 1, categoria: 'Varejo' },
    { nome: 'Jornal Pet', qtd: 3, categoria: 'Jornal' }
  ]);

  const metricsGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: isMobile ? '15px' : '20px',
    marginBottom: '30px'
  };

  const tablesGridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
    gap: '20px'
  };

  const tableContainerStyle = {
    background: '#fff',
    padding: isMobile ? '15px' : '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflowX: 'auto'
  };

  return (
    <div style={{ padding: isMobile ? '15px' : '20px' }}>
      <h2 style={{ marginBottom: '20px', color: '#333', fontSize: isMobile ? '20px' : '24px' }}>Dashboard</h2>
      
      {/* Filtros de Relatórios */}
      <div style={{
        background: '#fff',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: isMobile ? '16px' : '18px' }}>Relatórios</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Período</label>
            <select 
              value={periodoRelatorio}
              onChange={(e) => setPeriodoRelatorio(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="hoje">Hoje</option>
              <option value="quinzenal">Quinzenal</option>
              <option value="mensal">Mensal</option>
              <option value="personalizado">Personalizado</option>
            </select>
          </div>
          
          {periodoRelatorio === 'personalizado' && (
            <>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Data Inicial</label>
                <input 
                  type="date"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Data Final</label>
                <input 
                  type="date"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </>
          )}
          
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button 
              onClick={() => setMostrarRelatorio(!mostrarRelatorio)}
              style={{
                padding: '8px 16px',
                background: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {mostrarRelatorio ? 'Ocultar' : 'Mostrar'} Relatório
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div style={metricsGridStyle}>
        {periodoRelatorio === 'hoje' ? (
          <>
            <MetricCard title="Total Vendido Hoje" value={`R$ ${metrics.totalVendidoHoje.toFixed(2)}`} color="#28a745" isMobile={isMobile} />
            <MetricCard title="Lucro Hoje" value={`R$ ${metrics.lucroHoje.toFixed(2)}`} color="#17a2b8" isMobile={isMobile} />
            <MetricCard title="Débito Hoje" value={`R$ ${metrics.debitoHoje.toFixed(2)}`} color="#ffc107" isMobile={isMobile} />
            <MetricCard title="Crédito Hoje" value={`R$ ${metrics.creditoHoje.toFixed(2)}`} color="#6f42c1" isMobile={isMobile} />
            <MetricCard title="Pix Hoje" value={`R$ ${metrics.pixHoje.toFixed(2)}`} color="#20c997" isMobile={isMobile} />
            <MetricCard title="Dinheiro Hoje" value={`R$ ${metrics.dinheiroHoje.toFixed(2)}`} color="#198754" isMobile={isMobile} />
            <MetricCard title="Vendas Hoje" value={metrics.vendasHoje} color="#495057" isMobile={isMobile} />
            <MetricCard title="Estoque Baixo" value={metrics.estoqueBaixo} color="#dc3545" isMobile={isMobile} />
          </>
        ) : (
          (() => {
            const metricasPeriodo = calcularMetricasPeriodo();
            const titulo = periodoRelatorio === 'quinzenal' ? 'Quinzenal' : 
                          periodoRelatorio === 'mensal' ? 'Mensal' : 'Personalizado';
            return (
              <>
                <MetricCard title={`Total Vendido - ${titulo}`} value={`R$ ${metricasPeriodo.totalPeriodo.toFixed(2)}`} color="#28a745" isMobile={isMobile} />
                <MetricCard title={`Lucro - ${titulo}`} value={`R$ ${metricasPeriodo.lucroPeriodo.toFixed(2)}`} color="#17a2b8" isMobile={isMobile} />
                <MetricCard title={`Débito - ${titulo}`} value={`R$ ${metricasPeriodo.debitoPeriodo.toFixed(2)}`} color="#ffc107" isMobile={isMobile} />
                <MetricCard title={`Crédito - ${titulo}`} value={`R$ ${metricasPeriodo.creditoPeriodo.toFixed(2)}`} color="#6f42c1" isMobile={isMobile} />
                <MetricCard title={`Pix - ${titulo}`} value={`R$ ${metricasPeriodo.pixPeriodo.toFixed(2)}`} color="#20c997" isMobile={isMobile} />
                <MetricCard title={`Dinheiro - ${titulo}`} value={`R$ ${metricasPeriodo.dinheiroPeriodo.toFixed(2)}`} color="#198754" isMobile={isMobile} />
                <MetricCard title={`Vendas - ${titulo}`} value={metricasPeriodo.vendasPeriodo} color="#495057" isMobile={isMobile} />
                <MetricCard title="Estoque Baixo" value={metrics.estoqueBaixo} color="#dc3545" isMobile={isMobile} />
              </>
            );
          })()
        )}
      </div>

      {/* Relatório Detalhado */}
      {mostrarRelatorio && periodoRelatorio !== 'hoje' && (
        <div style={tableContainerStyle}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: isMobile ? '16px' : '18px' }}>
            Relatório {periodoRelatorio === 'quinzenal' ? 'Quinzenal' : 
                       periodoRelatorio === 'mensal' ? 'Mensal' : 'Personalizado'}
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '300px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: isMobile ? '8px' : '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: isMobile ? '12px' : '14px' }}>Data</th>
                  <th style={{ padding: isMobile ? '8px' : '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: isMobile ? '12px' : '14px' }}>Forma Pagamento</th>
                  <th style={{ padding: isMobile ? '8px' : '10px', textAlign: 'right', borderBottom: '1px solid #dee2e6', fontSize: isMobile ? '12px' : '14px' }}>Total</th>
                  <th style={{ padding: isMobile ? '8px' : '10px', textAlign: 'right', borderBottom: '1px solid #dee2e6', fontSize: isMobile ? '12px' : '14px' }}>Lucro</th>
                </tr>
              </thead>
              <tbody>
                {calcularMetricasPeriodo().vendasFiltradas.map((venda, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: isMobile ? '8px' : '10px', fontSize: isMobile ? '12px' : '14px' }}>{venda.data}</td>
                    <td style={{ padding: isMobile ? '8px' : '10px', fontSize: isMobile ? '12px' : '14px' }}>
                      <span style={{
                        background: venda.formaPagamento === 'credito' ? '#6f42c1' : 
                                   venda.formaPagamento === 'debito' ? '#ffc107' : 
                                   venda.formaPagamento === 'pix' ? '#20c997' : '#198754',
                        color: '#fff',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {venda.formaPagamento.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: isMobile ? '8px' : '10px', textAlign: 'right', fontSize: isMobile ? '12px' : '14px' }}>R$ {venda.total.toFixed(2)}</td>
                    <td style={{ padding: isMobile ? '8px' : '10px', textAlign: 'right', fontSize: isMobile ? '12px' : '14px' }}>R$ {venda.lucro.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabelas */}
      <div style={tablesGridStyle}>
        <div style={tableContainerStyle}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: isMobile ? '16px' : '18px' }}>Produtos Mais Vendidos</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '300px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: isMobile ? '8px' : '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: isMobile ? '12px' : '14px' }}>Produto</th>
                  <th style={{ padding: isMobile ? '8px' : '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontSize: isMobile ? '12px' : '14px' }}>Qtd</th>
                  <th style={{ padding: isMobile ? '8px' : '10px', textAlign: 'right', borderBottom: '1px solid #dee2e6', fontSize: isMobile ? '12px' : '14px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {produtosPopulares.map((produto, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: isMobile ? '8px' : '10px', fontSize: isMobile ? '12px' : '14px' }}>{produto.nome}</td>
                    <td style={{ padding: isMobile ? '8px' : '10px', textAlign: 'center', fontSize: isMobile ? '12px' : '14px' }}>{produto.qtd}</td>
                    <td style={{ padding: isMobile ? '8px' : '10px', textAlign: 'right', fontSize: isMobile ? '12px' : '14px' }}>R$ {produto.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={tableContainerStyle}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: isMobile ? '16px' : '18px' }}>Estoque Baixo</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '300px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: isMobile ? '8px' : '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: isMobile ? '12px' : '14px' }}>Produto</th>
                  <th style={{ padding: isMobile ? '8px' : '10px', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontSize: isMobile ? '12px' : '14px' }}>Qtd</th>
                  <th style={{ padding: isMobile ? '8px' : '10px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: isMobile ? '12px' : '14px' }}>Categoria</th>
                </tr>
              </thead>
              <tbody>
                {estoqueBaixo.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: isMobile ? '8px' : '10px', fontSize: isMobile ? '12px' : '14px' }}>{item.nome}</td>
                    <td style={{ padding: isMobile ? '8px' : '10px', textAlign: 'center', color: '#dc3545', fontWeight: 'bold', fontSize: isMobile ? '12px' : '14px' }}>{item.qtd}</td>
                    <td style={{ padding: isMobile ? '8px' : '10px', fontSize: isMobile ? '12px' : '14px' }}>{item.categoria}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, color, isMobile }) {
  return (
    <div style={{ 
      background: '#fff', 
      padding: isMobile ? '15px' : '20px', 
      borderRadius: '8px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      borderLeft: `4px solid ${color}`
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#666', fontSize: isMobile ? '12px' : '14px' }}>{title}</h4>
      <p style={{ margin: 0, fontSize: isMobile ? '20px' : '24px', fontWeight: 'bold', color: color }}>{value}</p>
    </div>
  );
}

function Produtos({ isMobile }) {
  const [produtos, setProdutos] = useState([]);
  const [buscaNome, setBuscaNome] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [fornecedorFiltro, setFornecedorFiltro] = useState('Todos');
  const [fornecedores, setFornecedores] = useState([]);
  const [novoProduto, setNovoProduto] = useState({
    nome: '',
    descricao: '',
    preco: '',
    estoque: '',
    codigoBarras: '',
    fornecedorId: ''
  });
  const [showNovoProduto, setShowNovoProduto] = useState(false);
  const [showEditarProduto, setShowEditarProduto] = useState(false);
  const [showEntradaEstoque, setShowEntradaEstoque] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [entradaEstoque, setEntradaEstoque] = useState({ produtoId: '', quantidade: '', observacao: '' });
  const [showImportCSV, setShowImportCSV] = useState(false);
  const [showImportDeleteCSV, setShowImportDeleteCSV] = useState(false);
  const [, setCsvFile] = useState(null);
  const [, setDeleteCsvFile] = useState(null);
  const [importStatus, setImportStatus] = useState({ type: '', message: '' });
  const [deleteStatus, setDeleteStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    // Carregar produtos e fornecedores da API
    Promise.all([
      fetch(`${API_URL}/produtos`).then(res => res.json()),
      fetch(`${API_URL}/fornecedores`).then(res => res.json()),
    ]).then(([produtosData, fornecedoresData]) => {

      // Verificar se os dados são arrays antes de setar
      if (Array.isArray(produtosData)) {
        // Normalizar payload do backend (Prisma) para as chaves que a UI já usa
        const produtosNormalizados = produtosData.map(p => ({
          ...p,
          codigo: p.codigo ?? p.codigoBarras ?? '',
          precoVenda: p.precoVenda ?? p.preco ?? 0,
          precoCusto: p.precoCusto ?? p.preco ?? 0,
          fornecedor: p.fornecedor?.nome
            ? { nome: p.fornecedor.nome }
            : p.fornecedor,
          categoria: p.categoria ?? '-',
          tipo: p.tipo ?? '-',
        }));
        setProdutos(produtosNormalizados);
      } else {

        console.error('API retornou dados inválidos para produtos:', produtosData);
        // Usar mock data como fallback
        setProdutos([
          { id: 1, codigo: '001', nome: 'Jornal Pet', categoria: 'Jornal', tipo: 'Consignado', precoVenda: 10.00, precoCusto: 8.50, estoque: 5, fornecedor: 'Distribuidora Azevedo' },
          { id: 2, codigo: '002', nome: 'Varejo 1,5', categoria: 'Varejo', tipo: 'Próprio', precoVenda: 1.50, precoCusto: 0.82, estoque: 15, fornecedor: '-' },
          { id: 3, codigo: '003', nome: 'Trident Tutti Fruti', categoria: 'Bomboniere', tipo: 'Consignado', precoVenda: 3.50, precoCusto: 3.00, estoque: 2, fornecedor: 'Distribuidora Doce' },
          { id: 4, codigo: '004', nome: 'A Tribuna', categoria: 'Jornal', tipo: 'Consignado', precoVenda: 2.50, precoCusto: 2.10, estoque: 8, fornecedor: 'Distribuidora Azevedo' },
          { id: 5, codigo: '005', nome: 'Varejo 1 real', categoria: 'Varejo', tipo: 'Próprio', precoVenda: 1.00, precoCusto: 0.41, estoque: 20, fornecedor: '-' },
        ]);
      }
      
      if (Array.isArray(fornecedoresData)) {
        setFornecedores(fornecedoresData);
      } else {
        console.error('API retornou dados inválidos para fornecedores:', fornecedoresData);
        // Usar mock data como fallback
        setFornecedores([
          { id: 1, nome: 'Distribuidora Azevedo' },
          { id: 2, nome: 'Distribuidora Doce' },
          { id: 3, nome: 'Editora Brasil' },
        ]);
      }
    }).catch(error => {
      console.error('Erro ao carregar dados:', error);
      // Mock data como fallback
      setProdutos([
        { id: 1, codigo: '001', nome: 'Jornal Pet', categoria: 'Jornal', tipo: 'Consignado', precoVenda: 10.00, precoCusto: 8.50, estoque: 5, fornecedor: 'Distribuidora Azevedo' },
        { id: 2, codigo: '002', nome: 'Varejo 1,5', categoria: 'Varejo', tipo: 'Próprio', precoVenda: 1.50, precoCusto: 0.82, estoque: 15, fornecedor: '-' },
        { id: 3, codigo: '003', nome: 'Trident Tutti Fruti', categoria: 'Bomboniere', tipo: 'Consignado', precoVenda: 3.50, precoCusto: 3.00, estoque: 2, fornecedor: 'Distribuidora Doce' },
        { id: 4, codigo: '004', nome: 'A Tribuna', categoria: 'Jornal', tipo: 'Consignado', precoVenda: 2.50, precoCusto: 2.10, estoque: 8, fornecedor: 'Distribuidora Azevedo' },
        { id: 5, codigo: '005', nome: 'Varejo 1 real', categoria: 'Varejo', tipo: 'Próprio', precoVenda: 1.00, precoCusto: 0.41, estoque: 20, fornecedor: '-' },
      ]);
      setFornecedores([
        { id: 1, nome: 'Distribuidora Azevedo' },
        { id: 2, nome: 'Distribuidora Doce' },
        { id: 3, nome: 'Editora Brasil' },
      ]);
    });
  }, []);

  const getEstoqueColor = (estoque) => {
    if (estoque <= 3) return '#dc3545';
    if (estoque <= 10) return '#ffc107';
    return '#28a745';
  };

  const getTipoBadge = (tipo) => {
    const color = tipo === 'Consignado' ? '#fd7e14' : '#28a745';
    return (
      <span style={{
        background: color,
        color: '#fff',
        padding: '2px 6px',
        borderRadius: '12px',
        fontSize: isMobile ? '10px' : '12px',
        fontWeight: 'bold'
      }}>
        {tipo}
      </span>
    );
  };

  const getEstoqueBadge = (estoque) => {
    const color = getEstoqueColor(estoque);
    return (
      <span style={{
        background: color,
        color: '#fff',
        padding: '2px 6px',
        borderRadius: '4px',
        fontSize: isMobile ? '10px' : '12px',
        fontWeight: 'bold'
      }}>
        {estoque}
      </span>
    );
  };

  const handleNovoProduto = async () => {
    try {
      const response = await fetch(`${API_URL}/produtos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: novoProduto.nome,
          descricao: novoProduto.descricao,
          preco: parseFloat(novoProduto.preco),
          estoque: parseInt(novoProduto.estoque),
          codigoBarras: novoProduto.codigoBarras || null,
          fornecedorId: novoProduto.fornecedorId ? parseInt(novoProduto.fornecedorId) : null
        })
      });

      if (response.ok) {
        const produtoCriado = await response.json();
        setProdutos([...produtos, produtoCriado]);
        setShowNovoProduto(false);
        setNovoProduto({
          nome: '',
          descricao: '',
          preco: '',
          estoque: '',
          codigoBarras: ''
        });
        alert('Produto cadastrado com sucesso!');
      } else {
        alert('Erro ao cadastrar produto');
      }
    } catch (error) {
      console.error('Erro ao cadastrar produto:', error);
      alert('Erro ao cadastrar produto');
    }
  };

  const handleEntradaEstoque = async (produto) => {
    setProdutoEditando(produto);
    setShowEntradaEstoque(true);
  };

  const handleEditarProduto = async (produto) => {
    setProdutoEditando(produto);
    setNovoProduto({
      nome: produto.nome || '',
      descricao: produto.descricao || '',
      preco: produto.preco ? produto.preco.toString() : '',
      estoque: produto.estoque ? produto.estoque.toString() : '',
      codigoBarras: produto.codigoBarras || '',
      fornecedorId: produto.fornecedorId ? produto.fornecedorId.toString() : ''
    });
    setShowEditarProduto(true);
  };

  const handleExcluirProduto = async (produto) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)) {
      try {
        const response = await fetch(`${API_URL}/produtos/${produto.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setProdutos(produtos.filter(p => p.id !== produto.id));
          alert('Produto excluído com sucesso!');
        } else {
          alert('Erro ao excluir produto');
        }
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
        alert('Erro ao excluir produto');
      }
    }
  };

  const handleConfirmarEntrada = async () => {
    try {
      const response = await fetch(`${API_URL}/movimentacoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: 'entrada',
          quantidade: parseInt(entradaEstoque.quantidade),
          motivo: entradaEstoque.motivo,
          produtoId: produtoEditando.id
        })
      });

      if (response.ok) {
        // Atualizar estoque do produto
        const produtosAtualizados = Array.isArray(produtos) ? produtos.map(p => 
          p.id === produtoEditando.id 
            ? { ...p, estoque: p.estoque + parseInt(entradaEstoque.quantidade) }
            : p
        ) : [];
        setProdutos(produtosAtualizados);
        
        setShowEntradaEstoque(false);
        setEntradaEstoque({ quantidade: '', motivo: '' });
        setProdutoEditando(null);
        alert('Entrada de estoque registrada com sucesso!');
      } else {
        alert('Erro ao registrar entrada de estoque');
      }
    } catch (error) {
      console.error('Erro ao registrar entrada de estoque:', error);
      alert('Erro ao registrar entrada de estoque');
    }
  };

  const handleAtualizarProduto = async () => {
    try {
      const response = await fetch(`${API_URL}/produtos/${produtoEditando.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: novoProduto.nome,
          descricao: novoProduto.descricao,
          preco: parseFloat(novoProduto.preco),
          estoque: parseInt(novoProduto.estoque),
          codigoBarras: (novoProduto.codigoBarras ?? '').toString().trim() ? novoProduto.codigoBarras.toString().trim() : null,
          fornecedorId: novoProduto.fornecedorId ? parseInt(novoProduto.fornecedorId) : null
        })
      });

      if (response.ok) {
        const produtoAtualizado = await response.json();
        const produtosAtualizados = Array.isArray(produtos) ? produtos.map(p => 
          p.id === produtoEditando.id ? produtoAtualizado : p
        ) : [];
        setProdutos(produtosAtualizados);
        
        setShowEditarProduto(false);
        setNovoProduto({
          nome: '',
          descricao: '',
          preco: '',
          estoque: '',
          codigoBarras: ''
        });
        setProdutoEditando(null);
        alert('Produto atualizado com sucesso!');
      } else {
        alert('Erro ao atualizar produto');
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      alert('Erro ao atualizar produto');
    }
  };

  // Funções para processar CSV
  const processarCSV = (texto) => {
    const linhas = texto.split('\n').filter(linha => linha.trim());
    if (linhas.length < 2) {
      setImportStatus({ type: 'error', message: 'CSV deve ter pelo menos uma linha de cabeçalho e uma de dados!' });
      return [];
    }

    const cabecalho = linhas[0].split(',').map(col => col.trim().toLowerCase());
    const produtos = [];
    const erros = [];

    // Verificar colunas obrigatórias
    const colunasObrigatorias = ['nome', 'preco'];
    const colunasFaltantes = colunasObrigatorias.filter(col => !cabecalho.includes(col));
    
    if (colunasFaltantes.length > 0) {
      setImportStatus({ 
        type: 'error', 
        message: `Colunas obrigatórias faltantes: ${colunasFaltantes.join(', ')}` 
      });
      return [];
    }

    // Processar produtos
    for (let i = 1; i < linhas.length; i++) {
      const valores = linhas[i].split(',').map(val => val.trim());
      const produto = {};
      
      cabecalho.forEach((coluna, index) => {
        produto[coluna] = valores[index] || '';
      });

      // Validações
      if (!produto.nome) {
        erros.push(`Linha ${i + 1}: Nome é obrigatório`);
        continue;
      }

      // Se preço estiver vazio, define como 0
      if (!produto.preco || produto.preco === '') {
        produto.preco = 0;
      } else {
        // Se não estiver vazio, valida se é número
        const precoLimpo = produto.preco.replace(',', '.').replace('R$', '').trim();
        const precoNumerico = parseFloat(precoLimpo);
        if (isNaN(precoNumerico)) {
          erros.push(`Linha ${i + 1}: Preço deve ser um número válido`);
          continue;
        }
        produto.preco = precoNumerico;
      }
      produto.descricao = produto.descricao || '';
      produto.estoque = produto.estoque ? parseInt(produto.estoque) : 0;
      produto.codigoBarras = produto.codigoBarras || '';
      produto.fornecedorId = produto.fornecedorId || null;

      produtos.push(produto);
    }

    if (erros.length > 0) {
      setImportStatus({ 
        type: 'warning', 
        message: `Importado com ${erros.length} erros: ${erros.slice(0, 3).join('; ')}` 
      });
    } else {
      setImportStatus({ 
        type: 'success', 
        message: `${produtos.length} produtos importados com sucesso!` 
      });
    }

    return produtos;
  };

  const lerArquivoCSV = async (arquivo) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const texto = e.target.result;
      console.log('📄 Conteúdo do CSV:', texto);
      
      const produtosProcessados = processarCSV(texto);
      console.log('📦 Produtos processados:', produtosProcessados);
      console.log('📊 Total de produtos:', produtosProcessados.length);
      
      if (produtosProcessados.length > 0) {
        try {
          console.log('🚀 Iniciando salvamento de', produtosProcessados.length, 'produtos...');
          
          // Salvar cada produto no backend
          const promessas = produtosProcessados.map((produto, index) => {
            console.log(`📝 Produto ${index + 1}:`, produto);
            
            // Validar dados antes de enviar
            const dadosParaEnviar = {
              nome: produto.nome || '',
              descricao: produto.descricao || '',
              preco: parseFloat(produto.preco) || 0,
              estoque: parseInt(produto.estoque) || 0,
              codigoBarras: produto.codigoBarras || null,
              fornecedorId: produto.fornecedorId ? parseInt(produto.fornecedorId) : null
            };
            
            console.log(`📤 Dados a enviar:`, dadosParaEnviar);
            
            return fetch(`${API_URL}/produtos`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(dadosParaEnviar)
            });
          });

          console.log('⏳ Enviando', promessas.length, 'requisições para o backend...');
          const respostas = await Promise.allSettled(promessas);
          
          console.log('📋 Respostas do backend:', respostas);
          
          const sucesso = respostas.filter(r => r.status === 'fulfilled').length;
          const falhas = respostas.filter(r => r.status === 'rejected').length;
          
          console.log('✅ Sucessos:', sucesso);
          console.log('❌ Falhas:', falhas);
          
          // Detalhar falhas
          respostas.forEach((resposta, index) => {
            if (resposta.status === 'rejected') {
              console.error(`❌ Erro no produto ${index + 1}:`, resposta.reason);
            }
          });

          if (sucesso > 0) {
            console.log('🔄 Recarregando lista de produtos...');
            // Recarregar produtos do backend
            const response = await fetch(`${API_URL}/produtos`);
            const produtosAtualizados = await response.json();
            console.log('📦 Produtos atualizados do backend:', produtosAtualizados);
            setProdutos(produtosAtualizados);
            
            setImportStatus({ 
              type: falhas > 0 ? 'warning' : 'success',
              message: `${sucesso} produtos salvos com sucesso${falhas > 0 ? ` e ${falhas} falhas` : ''}!` 
            });
          } else {
            setImportStatus({ 
              type: 'error', 
              message: 'Erro ao salvar produtos no backend!' 
            });
          }

          setCsvFile(null);
          setTimeout(() => {
            setShowImportCSV(false);
            setImportStatus({ type: '', message: '' });
          }, 3000);
        } catch (error) {
          console.error('💥 Erro ao salvar produtos:', error);
          setImportStatus({ type: 'error', message: 'Erro ao salvar produtos no backend!' });
        }
      }
    };
    reader.onerror = () => {
      console.error('❌ Erro ao ler arquivo CSV');
      setImportStatus({ type: 'error', message: 'Erro ao ler arquivo CSV!' });
    };
    reader.readAsText(arquivo, 'UTF-8');
  };

  const handleFileUpload = (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    // Verificar se é CSV
    if (!arquivo.name.endsWith('.csv')) {
      setImportStatus({ type: 'error', message: 'Por favor, selecione um arquivo CSV!' });
      return;
    }

    setCsvFile(arquivo);
    setImportStatus({ type: '', message: '' });
    lerArquivoCSV(arquivo);
  };

  // Funções para processar CSV de exclusão
  const processarCSVExclusao = (texto) => {
    const linhas = texto.split('\n').filter(linha => linha.trim());
    if (linhas.length < 2) {
      setDeleteStatus({ type: 'error', message: 'CSV deve ter pelo menos uma linha de cabeçalho e uma de dados!' });
      return [];
    }

    const cabecalho = linhas[0].split(',').map(col => col.trim().toLowerCase());
    const produtosParaExcluir = [];
    const erros = [];

    // Verificar colunas obrigatórias (pode ser nome ou id)
    const colunasPossiveis = ['nome', 'id', 'codigo'];
    const colunaEncontrada = colunasPossiveis.find(col => cabecalho.includes(col));
    
    if (!colunaEncontrada) {
      setDeleteStatus({ 
        type: 'error', 
        message: `CSV deve conter uma das colunas: ${colunasPossiveis.join(', ')}` 
      });
      return [];
    }

    // Processar produtos para excluir
    for (let i = 1; i < linhas.length; i++) {
      const valores = linhas[i].split(',').map(val => val.trim());
      const identificador = valores[cabecalho.indexOf(colunaEncontrada)];
      
      if (!identificador) {
        erros.push(`Linha ${i + 1}: ${colunaEncontrada} é obrigatório`);
        continue;
      }

      produtosParaExcluir.push({
        tipo: colunaEncontrada,
        valor: identificador,
        linha: i + 1
      });
    }

    if (erros.length > 0) {
      setDeleteStatus({ 
        type: 'warning', 
        message: `Processado com ${erros.length} erros: ${erros.slice(0, 3).join('; ')}` 
      });
    } else {
      setDeleteStatus({ 
        type: 'success', 
        message: `${produtosParaExcluir.length} produtos identificados para exclusão!` 
      });
    }

    return produtosParaExcluir;
  };

  const lerArquivoCSVExclusao = (arquivo) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const texto = e.target.result;
      const produtosParaExcluir = processarCSVExclusao(texto);
      
      if (produtosParaExcluir.length > 0) {
        // Confirmar exclusão
        if (window.confirm(`Tem certeza que deseja excluir ${produtosParaExcluir.length} produtos? Esta ação não pode ser desfeita.`)) {
          executarExclusao(produtosParaExcluir);
        }
      }
    };
    reader.onerror = () => {
      setDeleteStatus({ type: 'error', message: 'Erro ao ler arquivo CSV!' });
    };
    reader.readAsText(arquivo, 'UTF-8');
  };

  const executarExclusao = async (produtosParaExcluir) => {
    try {
      const produtosParaExcluirComIds = produtosParaExcluir.map(item => {
        const produtoEncontrado = Array.isArray(produtos) ? produtos.find(produto => {
          if (item.tipo === 'nome') {
            return produto.nome.toLowerCase() === item.valor.toLowerCase();
          } else if (item.tipo === 'id') {
            return produto.id.toString() === item.valor;
          } else if (item.tipo === 'codigo') {
            return (produto.codigo || '').toLowerCase() === item.valor.toLowerCase();
          }
          return false;
        }) : null;

        if (produtoEncontrado) {
          return { ...item, produtoId: produtoEncontrado.id };
        }

        return null;
      }).filter(item => item !== null);

      if (produtosParaExcluirComIds.length > 0) {
        // Excluir produtos no backend
        const promessas = produtosParaExcluirComIds.map(item => 
          fetch(`${API_URL}/produtos/${item.produtoId}`, {
            method: 'DELETE'
          })
        );

        const respostas = await Promise.allSettled(promessas);
        const sucesso = respostas.filter(r => r.status === 'fulfilled').length;
        const falhas = respostas.filter(r => r.status === 'rejected').length;

        if (sucesso > 0) {
          // Recarregar produtos do backend
          const response = await fetch(`${API_URL}/produtos`);
          const produtosAtualizados = await response.json();
          setProdutos(produtosAtualizados);
          
          setDeleteStatus({ 
            type: falhas > 0 ? 'warning' : 'success',
            message: `${sucesso} produtos excluídos com sucesso${falhas > 0 ? ` e ${falhas} falhas` : ''}!` 
          });
          
          setTimeout(() => {
            setShowImportDeleteCSV(false);
            setDeleteCsvFile(null);
            setDeleteStatus({ type: '', message: '' });
          }, 3000);
        } else {
          setDeleteStatus({ 
            type: 'error', 
            message: 'Erro ao excluir produtos no backend!' 
          });
        }
      } else {
        setDeleteStatus({ 
          type: 'error', 
          message: 'Nenhum produto encontrado para exclusão!' 
        });
      }
    } catch (error) {
      console.error('Erro ao excluir produtos:', error);
      setDeleteStatus({ 
        type: 'error', 
        message: 'Erro ao excluir produtos no backend!' 
      });
    }
  };

  const handleFileDeleteUpload = (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;

    // Verificar se é CSV
    if (!arquivo.name.endsWith('.csv')) {
      setDeleteStatus({ type: 'error', message: 'Por favor, selecione um arquivo CSV!' });
      return;
    }

    setDeleteCsvFile(arquivo);
    setDeleteStatus({ type: '', message: '' });
    lerArquivoCSVExclusao(arquivo);
  };

  const headerStyle = {
    display: isMobile ? 'block' : 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    gap: isMobile ? '15px' : '0'
  };

  const filtersStyle = {
    background: '#fff',
    padding: isMobile ? '15px' : '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: isMobile ? 'block' : 'flex',
    gap: isMobile ? '10px' : '15px',
    alignItems: 'center'
  };

  const tableContainerStyle = {
    background: '#fff',
    padding: isMobile ? '15px' : '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflowX: 'auto'
  };

  return (
    <div style={{ padding: isMobile ? '15px' : '20px' }}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0, color: '#333', fontSize: isMobile ? '20px' : '24px' }}>Produtos</h2>
        <button 
          onClick={() => setShowNovoProduto(true)}
          style={{
            padding: isMobile ? '8px 16px' : '10px 20px',
            background: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : '14px',
            width: isMobile ? '100%' : 'auto'
          }}>
          + Novo Produto
        </button>
        <button 
          onClick={() => setShowImportCSV(true)}
          style={{
            padding: isMobile ? '8px 16px' : '10px 20px',
            background: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : '14px',
            width: isMobile ? '100%' : 'auto'
          }}>
          📁 Importar CSV
        </button>
        <button 
          onClick={() => setShowImportDeleteCSV(true)}
          style={{
            padding: isMobile ? '8px 16px' : '10px 20px',
            background: '#dc3545',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : '14px',
            width: isMobile ? '100%' : 'auto'
          }}>
          🗑️ Excluir CSV
        </button>
      </div>

      {/* Filtros */}
      <div style={filtersStyle}>
        <div style={{ width: isMobile ? '100%' : 'auto', flex: isMobile ? 'none' : 1 }}>
          <input 
            type="text"
            placeholder="Buscar por nome"
            value={buscaNome}
            onChange={(e) => setBuscaNome(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: isMobile ? '12px' : '14px'
            }}
          />
        </div>
        <div style={{ minWidth: isMobile ? '100%' : '150px' }}>
          <select 
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: isMobile ? '12px' : '14px'
            }}
          >
            <option value="Todas">Todas</option>
            <option value="Jornal">Jornal</option>
            <option value="Varejo">Varejo</option>
            <option value="Bomboniere">Bomboniere</option>
          </select>
        </div>
        <div style={{ minWidth: isMobile ? '100%' : '150px' }}>
          <select 
            value={fornecedorFiltro}
            onChange={(e) => setFornecedorFiltro(e.target.value)}
            style={{
              width: '100%',
              padding: isMobile ? '8px' : '10px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: isMobile ? '12px' : '14px'
            }}
          >
            <option value="Todos">Todos</option>
            <option value="Distribuidora Azevedo">Distribuidora Azevedo</option>
            <option value="Distribuidora Doce">Distribuidora Doce</option>
          </select>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div style={tableContainerStyle}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: isMobile ? '8px' : '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: isMobile ? '11px' : '14px', fontWeight: '600' }}>Código</th>
              <th style={{ padding: isMobile ? '8px' : '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: isMobile ? '11px' : '14px', fontWeight: '600' }}>Nome</th>
              <th style={{ padding: isMobile ? '8px' : '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: isMobile ? '11px' : '14px', fontWeight: '600' }}>Categoria</th>
              <th style={{ padding: isMobile ? '8px' : '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: isMobile ? '11px' : '14px', fontWeight: '600' }}>Tipo</th>
              <th style={{ padding: isMobile ? '8px' : '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6', fontSize: isMobile ? '11px' : '14px', fontWeight: '600' }}>Preço Venda</th>
              <th style={{ padding: isMobile ? '8px' : '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6', fontSize: isMobile ? '11px' : '14px', fontWeight: '600' }}>Preço Custo</th>
              <th style={{ padding: isMobile ? '8px' : '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontSize: isMobile ? '11px' : '14px', fontWeight: '600' }}>Estoque</th>
              <th style={{ padding: isMobile ? '8px' : '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: isMobile ? '11px' : '14px', fontWeight: '600' }}>Fornecedor</th>
              <th style={{ padding: isMobile ? '8px' : '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontSize: isMobile ? '11px' : '14px', fontWeight: '600' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(produtos) ? produtos.filter(produto =>
              !buscaNome || produto.nome.toLowerCase().includes(buscaNome.toLowerCase())
            ).map(produto => (
              <tr key={produto.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: isMobile ? '8px' : '12px', fontSize: isMobile ? '11px' : '14px' }}>{produto.codigo}</td>
                <td style={{ padding: isMobile ? '8px' : '12px', fontSize: isMobile ? '11px' : '14px', fontWeight: '500' }}>{produto.nome}</td>
                <td style={{ padding: isMobile ? '8px' : '12px', fontSize: isMobile ? '11px' : '14px' }}>{produto.categoria}</td>
                <td style={{ padding: isMobile ? '8px' : '12px' }}>{getTipoBadge(produto.tipo)}</td>
                <td style={{ padding: isMobile ? '8px' : '12px', textAlign: 'right', fontSize: isMobile ? '11px' : '14px' }}>R$ {(produto.precoVenda || produto.preco || 0).toFixed(2)}</td>
                <td style={{ padding: isMobile ? '8px' : '12px', textAlign: 'right', fontSize: isMobile ? '11px' : '14px' }}>R$ {(produto.precoCusto || produto.preco || 0).toFixed(2)}</td>
                <td style={{ padding: isMobile ? '8px' : '12px', textAlign: 'center' }}>{getEstoqueBadge(produto.estoque)}</td>
                <td style={{ padding: isMobile ? '8px' : '12px', fontSize: isMobile ? '11px' : '14px' }}>{produto.fornecedor?.nome || '-'}</td>
                <td style={{ padding: isMobile ? '6px' : '12px' }}>
                  <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                    <button 
                      onClick={() => handleEntradaEstoque(produto)}
                      style={{
                        padding: isMobile ? '3px 6px' : '4px 8px',
                        background: '#28a745',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: isMobile ? '10px' : '12px',
                        cursor: 'pointer',
                        marginBottom: isMobile ? '3px' : '0'
                      }}>Entrada</button>
                    <button 
                      onClick={() => handleEditarProduto(produto)}
                      style={{
                        padding: isMobile ? '3px 6px' : '4px 8px',
                        background: '#6c757d',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: isMobile ? '10px' : '12px',
                        cursor: 'pointer',
                        marginBottom: isMobile ? '3px' : '0'
                      }}>Editar</button>
                    <button 
                      onClick={() => handleExcluirProduto(produto)}
                      style={{
                        padding: isMobile ? '3px 6px' : '4px 8px',
                        background: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: isMobile ? '10px' : '12px',
                        cursor: 'pointer',
                        marginBottom: isMobile ? '3px' : '0'
                      }}>Excluir</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>
                  Nenhum produto encontrado ou erro ao carregar produtos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Novo Produto */}
      {showNovoProduto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: isMobile ? '20px' : '30px',
            borderRadius: '8px',
            width: isMobile ? '90%' : '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Novo Produto</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Nome</label>
              <input
                type="text"
                value={novoProduto.nome}
                onChange={(e) => setNovoProduto({...novoProduto, nome: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Descrição</label>
              <textarea
                value={novoProduto.descricao}
                onChange={(e) => setNovoProduto({...novoProduto, descricao: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '60px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Preço</label>
              <input
                type="number"
                step="0.01"
                value={novoProduto.preco}
                onChange={(e) => setNovoProduto({...novoProduto, preco: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Estoque</label>
              <input
                type="number"
                value={novoProduto.estoque}
                onChange={(e) => setNovoProduto({...novoProduto, estoque: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Código de Barras</label>
              <input
                type="text"
                value={novoProduto.codigoBarras}
                onChange={(e) => setNovoProduto({...novoProduto, codigoBarras: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Fornecedor</label>
              <select
                value={novoProduto.fornecedorId}
                onChange={(e) => setNovoProduto({...novoProduto, fornecedorId: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">Selecione um fornecedor</option>
                {fornecedores.map(fornecedor => (
                  <option key={fornecedor.id} value={fornecedor.id}>
                    {fornecedor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowNovoProduto(false)}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleNovoProduto}
                style={{
                  padding: '8px 16px',
                  background: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Entrada de Estoque */}
      {showEntradaEstoque && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: isMobile ? '20px' : '30px',
            borderRadius: '8px',
            width: isMobile ? '90%' : '400px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>
              Entrada de Estoque - {produtoEditando?.nome}
            </h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Quantidade</label>
              <input
                type="number"
                value={entradaEstoque.quantidade}
                onChange={(e) => setEntradaEstoque({...entradaEstoque, quantidade: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Motivo</label>
              <textarea
                value={entradaEstoque.motivo}
                onChange={(e) => setEntradaEstoque({...entradaEstoque, motivo: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '60px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowEntradaEstoque(false);
                  setEntradaEstoque({ quantidade: '', motivo: '' });
                  setProdutoEditando(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarEntrada}
                style={{
                  padding: '8px 16px',
                  background: '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Confirmar Entrada
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Produto */}
      {showEditarProduto && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: isMobile ? '20px' : '30px',
            borderRadius: '8px',
            width: isMobile ? '90%' : '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Editar Produto</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Nome</label>
              <input
                type="text"
                value={novoProduto.nome}
                onChange={(e) => setNovoProduto({...novoProduto, nome: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Descrição</label>
              <textarea
                value={novoProduto.descricao}
                onChange={(e) => setNovoProduto({...novoProduto, descricao: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '60px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Preço</label>
              <input
                type="number"
                step="0.01"
                value={novoProduto.preco}
                onChange={(e) => setNovoProduto({...novoProduto, preco: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Estoque</label>
              <input
                type="number"
                value={novoProduto.estoque}
                onChange={(e) => setNovoProduto({...novoProduto, estoque: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Código de Barras</label>
              <input
                type="text"
                value={novoProduto.codigoBarras}
                onChange={(e) => setNovoProduto({...novoProduto, codigoBarras: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Fornecedor</label>
              <select
                value={novoProduto.fornecedorId}
                onChange={(e) => setNovoProduto({...novoProduto, fornecedorId: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">Selecione um fornecedor</option>
                {fornecedores.map(fornecedor => (
                  <option key={fornecedor.id} value={fornecedor.id}>
                    {fornecedor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowEditarProduto(false);
                  setNovoProduto({
                    nome: '',
                    descricao: '',
                    preco: '',
                    estoque: '',
                    codigoBarras: ''
                  });
                  setProdutoEditando(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAtualizarProduto}
                style={{
                  padding: '8px 16px',
                  background: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Atualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Importação CSV */}
      {showImportCSV && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: isMobile ? '20px' : '30px',
            borderRadius: '8px',
            width: isMobile ? '90%' : '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Importar Produtos - CSV</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Selecione o arquivo CSV</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ 
              marginBottom: '15px',
              padding: '10px',
              background: '#f8f9fa',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#666'
            }}>
              <strong>Formato esperado:</strong><br/>
              nome,preco,descricao,estoque,codigoBarras,fornecedorId<br/>
              <em>Colunas obrigatórias: nome, preco</em>
            </div>

            {importStatus.message && (
              <div style={{
                marginBottom: '15px',
                padding: '10px',
                borderRadius: '4px',
                background: importStatus.type === 'error' ? '#f8d7da' : 
                           importStatus.type === 'warning' ? '#fff3cd' : '#d4edda',
                color: importStatus.type === 'error' ? '#721c24' : 
                       importStatus.type === 'warning' ? '#856404' : '#155724',
                fontSize: '14px'
              }}>
                {importStatus.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowImportCSV(false);
                  setCsvFile(null);
                  setImportStatus({ type: '', message: '' });
                }}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Exclusão CSV */}
      {showImportDeleteCSV && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: isMobile ? '20px' : '30px',
            borderRadius: '8px',
            width: isMobile ? '90%' : '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#dc3545' }}>⚠️ Excluir Produtos - CSV</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Selecione o arquivo CSV com produtos a excluir</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileDeleteUpload}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ 
              marginBottom: '15px',
              padding: '10px',
              background: '#f8d7da',
              borderRadius: '4px',
              fontSize: '12px',
              color: '#721c24',
              border: '1px solid #f5c6cb'
            }}>
              <strong>⚠️ ATENÇÃO - Esta ação é irreversível!</strong><br/>
              <strong>Formato esperado:</strong><br/>
              nome,id,codigo<br/>
              <em>Pelo menos uma coluna obrigatória: nome, id ou codigo</em><br/>
              <em>Ex: "Jornal Pet","1","001"</em>
            </div>

            {deleteStatus.message && (
              <div style={{
                marginBottom: '15px',
                padding: '10px',
                borderRadius: '4px',
                background: deleteStatus.type === 'error' ? '#f8d7da' : 
                           deleteStatus.type === 'warning' ? '#fff3cd' : '#d4edda',
                color: deleteStatus.type === 'error' ? '#721c24' : 
                       deleteStatus.type === 'warning' ? '#856404' : '#155724',
                fontSize: '14px'
              }}>
                {deleteStatus.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowImportDeleteCSV(false);
                  setDeleteCsvFile(null);
                  setDeleteStatus({ type: '', message: '' });
                }}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Fornecedores({ isMobile }) {
  const [fornecedores, setFornecedores] = useState([]);
  const [showNovoFornecedor, setShowNovoFornecedor] = useState(false);
  const [showEditarFornecedor, setShowEditarFornecedor] = useState(false);
  const [fornecedorEditando, setFornecedorEditando] = useState(null);
  const [novoFornecedor, setNovoFornecedor] = useState({
    nome: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    porcentagem: ''
  });

  useEffect(() => {
    // Carregar fornecedores da API
    fetch(`${API_URL}/fornecedores`)
      .then(res => res.json())
      .then(data => setFornecedores(data))
      .catch(error => {
        console.error('Erro ao carregar fornecedores:', error);
        // Mock data como fallback
        setFornecedores([
          { id: 1, nome: 'Distribuidora Azevedo', cnpj: '12345678901234', telefone: '(11) 9999-8888', email: 'contato@azevedo.com', endereco: 'Rua A, 123' },
          { id: 2, nome: 'Distribuidora Doce', cnpj: '56789012345678', telefone: '(11) 7777-6666', email: 'contato@doce.com', endereco: 'Rua B, 456' },
          { id: 3, nome: 'Editora Brasil', cnpj: '90123456789012', telefone: '(11) 5555-4444', email: 'contato@brasil.com', endereco: 'Rua C, 789' },
        ]);
      });
  }, []);

  const handleNovoFornecedor = async () => {
    try {
      const response = await fetch(`${API_URL}/fornecedores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...novoFornecedor,
          porcentagem: novoFornecedor.porcentagem ? parseFloat(novoFornecedor.porcentagem) : 0
        })
      });

      if (response.ok) {
        const fornecedorCriado = await response.json();
        setFornecedores([...fornecedores, fornecedorCriado]);
        setShowNovoFornecedor(false);
        setNovoFornecedor({
          nome: '',
          cnpj: '',
          telefone: '',
          email: '',
          endereco: '',
          porcentagem: ''
        });
        alert('Fornecedor cadastrado com sucesso!');
      } else {
        alert('Erro ao cadastrar fornecedor');
      }
    } catch (error) {
      console.error('Erro ao cadastrar fornecedor:', error);
      alert('Erro ao cadastrar fornecedor');
    }
  };

  const handleEditarFornecedor = async (fornecedor) => {
    setFornecedorEditando(fornecedor);
    setNovoFornecedor({
      nome: fornecedor.nome,
      cnpj: fornecedor.cnpj || '',
      telefone: fornecedor.telefone || '',
      email: fornecedor.email || '',
      endereco: fornecedor.endereco || '',
      porcentagem: fornecedor.porcentagem ? fornecedor.porcentagem.toString() : ''
    });
    setShowEditarFornecedor(true);
  };

  const handleExcluirFornecedor = async (fornecedor) => {
    if (window.confirm(`Tem certeza que deseja excluir o fornecedor "${fornecedor.nome}"?`)) {
      try {
        const response = await fetch(`${API_URL}/fornecedores/${fornecedor.id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          setFornecedores(fornecedores.filter(f => f.id !== fornecedor.id));
          alert('Fornecedor excluído com sucesso!');
        } else {
          alert('Erro ao excluir fornecedor');
        }
      } catch (error) {
        console.error('Erro ao excluir fornecedor:', error);
        alert('Erro ao excluir fornecedor');
      }
    }
  };

  const handleAtualizarFornecedor = async () => {
    try {
      const response = await fetch(`${API_URL}/fornecedores/${fornecedorEditando.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...novoFornecedor,
          porcentagem: novoFornecedor.porcentagem ? parseFloat(novoFornecedor.porcentagem) : 0
        })
      });

      if (response.ok) {
        const fornecedorAtualizado = await response.json();
        const fornecedoresAtualizados = fornecedores.map(f =>
          f.id === fornecedorEditando.id ? fornecedorAtualizado : f
        );
        setFornecedores(fornecedoresAtualizados);

        setShowEditarFornecedor(false);
        setNovoFornecedor({
          nome: '',
          cnpj: '',
          telefone: '',
          email: '',
          endereco: ''
        });
        setFornecedorEditando(null);
        alert('Fornecedor atualizado com sucesso!');
      } else {
        alert('Erro ao atualizar fornecedor');
      }
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      alert('Erro ao atualizar fornecedor');
    }
  };

  return (
    <div style={{ padding: isMobile ? '15px' : '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: isMobile ? '15px' : '0', flexDirection: isMobile ? 'column' : 'row' }}>
        <h2 style={{ margin: 0, color: '#333', fontSize: isMobile ? '20px' : '24px' }}>Fornecedores</h2>
        <button 
          onClick={() => setShowNovoFornecedor(true)}
          style={{
            padding: isMobile ? '8px 16px' : '10px 20px',
            background: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : '14px',
            width: isMobile ? '100%' : 'auto'
          }}
        >
          + Novo Fornecedor
        </button>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Nome</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Porcentagem</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Contato</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Produtos Vinculados</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {fornecedores.map(fornecedor => (
              <tr key={fornecedor.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>{fornecedor.nome}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{fornecedor.porcentagem ? `${fornecedor.porcentagem}%` : '-'}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{fornecedor.contato}</td>
                <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>{fornecedor.produtosVinculados}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                    <button 
                      onClick={() => handleEditarFornecedor(fornecedor)}
                      style={{
                        padding: isMobile ? '3px 6px' : '4px 8px',
                        background: '#6c757d',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: isMobile ? '10px' : '12px',
                        cursor: 'pointer',
                        marginBottom: isMobile ? '3px' : '0'
                      }}>Editar</button>
                    <button 
                      onClick={() => handleExcluirFornecedor(fornecedor)}
                      style={{
                        padding: isMobile ? '3px 6px' : '4px 8px',
                        background: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: isMobile ? '10px' : '12px',
                        cursor: 'pointer',
                        marginBottom: isMobile ? '3px' : '0'
                      }}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Novo Fornecedor */}
      {showNovoFornecedor && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: isMobile ? '20px' : '30px',
            borderRadius: '8px',
            width: isMobile ? '90%' : '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Novo Fornecedor</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Nome</label>
              <input
                type="text"
                value={novoFornecedor.nome}
                onChange={(e) => setNovoFornecedor({...novoFornecedor, nome: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>CNPJ</label>
              <input
                type="text"
                value={novoFornecedor.cnpj}
                onChange={(e) => setNovoFornecedor({...novoFornecedor, cnpj: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Telefone</label>
              <input
                type="text"
                value={novoFornecedor.telefone}
                onChange={(e) => setNovoFornecedor({...novoFornecedor, telefone: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Email</label>
              <input
                type="email"
                value={novoFornecedor.email}
                onChange={(e) => setNovoFornecedor({...novoFornecedor, email: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Endereço</label>
              <textarea
                value={novoFornecedor.endereco}
                onChange={(e) => setNovoFornecedor({...novoFornecedor, endereco: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '60px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Porcentagem por Venda (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={novoFornecedor.porcentagem}
                onChange={(e) => setNovoFornecedor({...novoFornecedor, porcentagem: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowNovoFornecedor(false)}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleNovoFornecedor}
                style={{
                  padding: '8px 16px',
                  background: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cadastrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Fornecedor */}
      {showEditarFornecedor && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: isMobile ? '20px' : '30px',
            borderRadius: '8px',
            width: isMobile ? '90%' : '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Editar Fornecedor</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Nome</label>
              <input
                type="text"
                value={novoFornecedor.nome}
                onChange={(e) => setNovoFornecedor({...novoFornecedor, nome: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>CNPJ</label>
              <input
                type="text"
                value={novoFornecedor.cnpj}
                onChange={(e) => setNovoFornecedor({...novoFornecedor, cnpj: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Telefone</label>
              <input
                type="text"
                value={novoFornecedor.telefone}
                onChange={(e) => setNovoFornecedor({...novoFornecedor, telefone: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Email</label>
              <input
                type="email"
                value={novoFornecedor.email}
                onChange={(e) => setNovoFornecedor({...novoFornecedor, email: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Endereço</label>
              <textarea
                value={novoFornecedor.endereco}
                onChange={(e) => setNovoFornecedor({...novoFornecedor, endereco: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '60px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Porcentagem por Venda (%)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={novoFornecedor.porcentagem}
                onChange={(e) => setNovoFornecedor({...novoFornecedor, porcentagem: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowEditarFornecedor(false);
                  setNovoFornecedor({
                    nome: '',
                    cnpj: '',
                    telefone: '',
                    email: '',
                    endereco: ''
                  });
                  setFornecedorEditando(null);
                }}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAtualizarFornecedor}
                style={{
                  padding: '8px 16px',
                  background: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Atualizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Movimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState([]);

  useEffect(() => {
    setMovimentacoes([
      { id: 1, data: '08/05/2026, 09:36:12', tipo: 'Saída', produto: 'Jornal Pet', categoria: 'Jornal', fornecedor: '-', quantidade: 1, observacao: 'Venda registrada' },
      { id: 2, data: '08/05/2026, 09:35:08', tipo: 'Entrada', produto: 'Jornal Pet', categoria: 'Jornal', fornecedor: '-', quantidade: 11, observacao: 'Estoque inicial' },
      { id: 3, data: '08/05/2026, 09:20:42', tipo: 'Saída', produto: 'Varejo 1,5', categoria: 'Varejo', fornecedor: '-', quantidade: 1, observacao: 'Venda registrada' },
      { id: 4, data: '08/05/2026, 09:19:32', tipo: 'Saída', produto: 'Varejo 1 real', categoria: 'Varejo', fornecedor: '-', quantidade: 1, observacao: 'Venda registrada' },
      { id: 5, data: '08/05/2026, 09:18:18', tipo: 'Saída', produto: 'Trindent Tutti Fruti', categoria: 'Bomboniere', fornecedor: '-', quantidade: 1, observacao: 'Venda registrada' },
      { id: 6, data: '08/05/2026, 09:17:54', tipo: 'Entrada', produto: 'Trindent Tutti Fruti', categoria: 'Bomboniere', fornecedor: '-', quantidade: 10, observacao: 'Estoque inicial' },
    ]);
  }, []);

  const getTipoBadge = (tipo) => {
    const color = tipo === 'Entrada' ? '#28a745' : '#dc3545';
    return (
      <span style={{
        background: color,
        color: '#fff',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        {tipo}
      </span>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Movimentações de Estoque</h2>
        <select style={{
          padding: '8px 12px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <option>Todos os tipos</option>
          <option>Entrada</option>
          <option>Saída</option>
        </select>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Data</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Tipo</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Produto</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Categoria</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Fornecedor</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Quantidade</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Observação</th>
            </tr>
          </thead>
          <tbody>
            {movimentacoes.map(mov => (
              <tr key={mov.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px', fontSize: '14px' }}>{mov.data}</td>
                <td style={{ padding: '12px' }}>{getTipoBadge(mov.tipo)}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{mov.produto}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{mov.categoria}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{mov.fornecedor}</td>
                <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>{mov.quantidade}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{mov.observacao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Saidas({ isMobile }) {
  const [saidas, setSaidas] = useState([]);
  const [showNovaSaida, setShowNovaSaida] = useState(false);
  const [novaSaida, setNovaSaida] = useState({
    produtoId: '',
    quantidade: '',
    motivo: ''
  });
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    // Carregar produtos e saídas da API
    Promise.all([
      fetch(`${API_URL}/produtos`).then(res => res.json()),
      fetch(`${API_URL}/movimentacoes`).then(res => res.json())
    ]).then(([produtosData, movimentacoesData]) => {
      setProdutos(produtosData);
      const saidasData = movimentacoesData.filter(m => m.tipo === 'saida');
      setSaidas(saidasData.map(saida => ({
        ...saida,
        produto: produtosData.find(p => p.id === saida.produtoId)?.nome || 'Produto não encontrado',
        categoria: produtosData.find(p => p.id === saida.produtoId)?.categoria || '-',
        fornecedor: '-'
      })));
    }).catch(error => {
      console.error('Erro ao carregar dados:', error);
      // Mock data como fallback
      setSaidas([
        { id: 1, data: '08/05/2026, 09:36:12', produto: 'Jornal Pet', categoria: 'Jornal', fornecedor: '-', quantidade: -1, observacao: 'Venda registrada' },
        { id: 2, data: '08/05/2026, 09:20:42', produto: 'Varejo 1,5', categoria: 'Varejo', fornecedor: '-', quantidade: -1, observacao: 'Venda registrada' },
        { id: 3, data: '08/05/2026, 09:19:32', produto: 'Varejo 1 real', categoria: 'Varejo', fornecedor: '-', quantidade: -1, observacao: 'Venda registrada' },
      ]);
      setProdutos([
        { id: 1, nome: 'Jornal Pet', categoria: 'Jornal', estoque: 5 },
        { id: 2, nome: 'Varejo 1,5', categoria: 'Varejo', estoque: 15 },
        { id: 3, nome: 'Trident Tutti Fruti', categoria: 'Bomboniere', estoque: 2 },
      ]);
    });
  }, []);

  const handleNovaSaida = async () => {
    try {
      const response = await fetch(`${API_URL}/movimentacoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: 'saida',
          quantidade: -parseInt(novaSaida.quantidade),
          motivo: novaSaida.motivo,
          produtoId: parseInt(novaSaida.produtoId)
        })
      });

      if (response.ok) {
        const saidaCriada = await response.json();
        const produtoSelecionado = Array.isArray(produtos) ? produtos.find(p => p.id === parseInt(novaSaida.produtoId)) : null;
        
        setSaidas([{
          ...saidaCriada,
          produto: produtoSelecionado?.nome || 'Produto',
          categoria: produtoSelecionado?.categoria || '-',
          fornecedor: '-'
        }, ...saidas]);

        // Atualizar estoque do produto localmente
        const produtosAtualizados = Array.isArray(produtos) ? produtos.map(p => 
          p.id === parseInt(novaSaida.produtoId) 
            ? { ...p, estoque: p.estoque - parseInt(novaSaida.quantidade) }
            : p
        ) : [];
        setProdutos(produtosAtualizados);
        
        setShowNovaSaida(false);
        setNovaSaida({
          produtoId: '',
          quantidade: '',
          motivo: ''
        });
        alert('Saída de estoque registrada com sucesso!');
      } else {
        alert('Erro ao registrar saída de estoque');
      }
    } catch (error) {
      console.error('Erro ao registrar saída de estoque:', error);
      alert('Erro ao registrar saída de estoque');
    }
  };

  return (
    <div style={{ padding: isMobile ? '15px' : '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: isMobile ? '15px' : '0', flexDirection: isMobile ? 'column' : 'row' }}>
        <h2 style={{ margin: 0, color: '#333', fontSize: isMobile ? '20px' : '24px' }}>Saídas de Estoque</h2>
        <button 
          onClick={() => setShowNovaSaida(true)}
          style={{
            padding: isMobile ? '8px 16px' : '10px 20px',
            background: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : '14px',
            width: isMobile ? '100%' : 'auto'
          }}>
          + Nova Saída
        </button>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Data</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Produto</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Categoria</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Fornecedor</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Quantidade</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Observação</th>
            </tr>
          </thead>
          <tbody>
            {saidas.map(saida => (
              <tr key={saida.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px', fontSize: '14px' }}>{saida.data}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{saida.produto}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{saida.categoria}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{saida.fornecedor}</td>
                <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#dc3545' }}>{saida.quantidade}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{saida.observacao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Saída */}
      {showNovaSaida && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: isMobile ? '20px' : '30px',
            borderRadius: '8px',
            width: isMobile ? '90%' : '400px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Nova Saída de Estoque</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Produto</label>
              <select
                value={novaSaida.produtoId}
                onChange={(e) => setNovaSaida({...novaSaida, produtoId: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">Selecione um produto</option>
                {Array.isArray(produtos) ? produtos.map(produto => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome} (Estoque: {produto.estoque})
                  </option>
                )) : null}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Quantidade</label>
              <input
                type="number"
                value={novaSaida.quantidade}
                onChange={(e) => setNovaSaida({...novaSaida, quantidade: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Motivo</label>
              <textarea
                value={novaSaida.motivo}
                onChange={(e) => setNovaSaida({...novaSaida, motivo: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '60px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowNovaSaida(false);
                  setNovaSaida({
                    produtoId: '',
                    quantidade: '',
                    motivo: ''
                  });
                }}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleNovaSaida}
                style={{
                  padding: '8px 16px',
                  background: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Registrar Saída
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Entradas({ isMobile }) {
  const [entradas, setEntradas] = useState([]);
  const [showNovaEntrada, setShowNovaEntrada] = useState(false);
  const [novaEntrada, setNovaEntrada] = useState({
    produtoId: '',
    quantidade: '',
    motivo: ''
  });
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    // Carregar produtos e entradas da API
    Promise.all([
      fetch(`${API_URL}/produtos`).then(res => res.json()),
      fetch(`${API_URL}/movimentacoes`).then(res => res.json())
    ]).then(([produtosData, movimentacoesData]) => {
      setProdutos(produtosData);
      const entradasData = movimentacoesData.filter(m => m.tipo === 'entrada');
      setEntradas(entradasData.map(entrada => ({
        ...entrada,
        produto: produtosData.find(p => p.id === entrada.produtoId)?.nome || 'Produto não encontrado',
        categoria: produtosData.find(p => p.id === entrada.produtoId)?.categoria || '-',
        fornecedor: produtosData.find(p => p.id === entrada.produtoId)?.fornecedor || '-'
      })));
    }).catch(error => {
      console.error('Erro ao carregar dados:', error);
      // Mock data como fallback
      setEntradas([
        { id: 1, data: '08/05/2026, 09:35:08', produto: 'Jornal Pet', categoria: 'Jornal', fornecedor: '-', quantidade: 11, observacao: 'Estoque inicial' },
        { id: 2, data: '08/05/2026, 09:17:54', produto: 'Trident Tutti Fruti', categoria: 'Bomboniere', fornecedor: '-', quantidade: 10, observacao: 'Estoque inicial' },
        { id: 3, data: '08/05/2026, 08:36:28', produto: 'A Tribuna', categoria: 'Jornal', fornecedor: 'Distribuidora Azevedo', quantidade: 3, observacao: 'Entrada' },
      ]);
      setProdutos([
        { id: 1, nome: 'Jornal Pet', categoria: 'Jornal', estoque: 5 },
        { id: 2, nome: 'Trident Tutti Fruti', categoria: 'Bomboniere', estoque: 2 },
        { id: 3, nome: 'A Tribuna', categoria: 'Jornal', estoque: 8 },
      ]);
    });
  }, []);

  const handleNovaEntrada = async () => {
    try {
      const response = await fetch(`${API_URL}/movimentacoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipo: 'entrada',
          quantidade: parseInt(novaEntrada.quantidade),
          motivo: novaEntrada.motivo,
          produtoId: parseInt(novaEntrada.produtoId)
        })
      });

      if (response.ok) {
        const entradaCriada = await response.json();
        const produtoSelecionado = Array.isArray(produtos) ? produtos.find(p => p.id === parseInt(novaEntrada.produtoId)) : null;
        
        setEntradas([{
          ...entradaCriada,
          produto: produtoSelecionado?.nome || 'Produto',
          categoria: produtoSelecionado?.categoria || '-',
          fornecedor: produtoSelecionado?.fornecedor || '-'
        }, ...entradas]);

        // Atualizar estoque do produto localmente
        const produtosAtualizados = Array.isArray(produtos) ? produtos.map(p => 
          p.id === parseInt(novaEntrada.produtoId) 
            ? { ...p, estoque: p.estoque + parseInt(novaEntrada.quantidade) }
            : p
        ) : [];
        setProdutos(produtosAtualizados);
        
        setShowNovaEntrada(false);
        setNovaEntrada({
          produtoId: '',
          quantidade: '',
          motivo: ''
        });
        alert('Entrada de estoque registrada com sucesso!');
      } else {
        alert('Erro ao registrar entrada de estoque');
      }
    } catch (error) {
      console.error('Erro ao registrar entrada de estoque:', error);
      alert('Erro ao registrar entrada de estoque');
    }
  };

  return (
    <div style={{ padding: isMobile ? '15px' : '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: isMobile ? '15px' : '0', flexDirection: isMobile ? 'column' : 'row' }}>
        <h2 style={{ margin: 0, color: '#333', fontSize: isMobile ? '20px' : '24px' }}>Entradas de Estoque</h2>
        <button 
          onClick={() => setShowNovaEntrada(true)}
          style={{
            padding: isMobile ? '8px 16px' : '10px 20px',
            background: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : '14px',
            width: isMobile ? '100%' : 'auto'
          }}>
          + Nova Entrada
        </button>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Data</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Produto</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Categoria</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Fornecedor</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Quantidade</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Observação</th>
            </tr>
          </thead>
          <tbody>
            {entradas.map(entrada => (
              <tr key={entrada.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px', fontSize: '14px' }}>{entrada.data}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{entrada.produto}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{entrada.categoria}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{entrada.fornecedor}</td>
                <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', color: '#28a745', fontWeight: 'bold' }}>+{entrada.quantidade}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{entrada.observacao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Entrada */}
      {showNovaEntrada && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: isMobile ? '20px' : '30px',
            borderRadius: '8px',
            width: isMobile ? '90%' : '400px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Nova Entrada de Estoque</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Produto</label>
              <select
                value={novaEntrada.produtoId}
                onChange={(e) => setNovaEntrada({...novaEntrada, produtoId: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">Selecione um produto</option>
                {Array.isArray(produtos) ? produtos.map(produto => (
                  <option key={produto.id} value={produto.id}>
                    {produto.nome} (Estoque: {produto.estoque})
                  </option>
                )) : null}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Quantidade</label>
              <input
                type="number"
                value={novaEntrada.quantidade}
                onChange={(e) => setNovaEntrada({...novaEntrada, quantidade: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Motivo</label>
              <textarea
                value={novaEntrada.motivo}
                onChange={(e) => setNovaEntrada({...novaEntrada, motivo: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  minHeight: '60px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowNovaEntrada(false);
                  setNovaEntrada({
                    produtoId: '',
                    quantidade: '',
                    motivo: ''
                  });
                }}
                style={{
                  padding: '8px 16px',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleNovaEntrada}
                style={{
                  padding: '8px 16px',
                  background: '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Registrar Entrada
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VendaPage() {
  const [statusCaixa] = useState('aberto');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const [valorPagoCliente, setValorPagoCliente] = useState(0.00);
  const [itensVenda, setItensVenda] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [ultimaVenda, setUltimaVenda] = useState(null);
  const [vendasRecentes, setVendasRecentes] = useState([]);
  const [showFinalizarVenda, setShowFinalizarVenda] = useState(false);

  useEffect(() => {
    // Carregar produtos
    fetch(`${API_URL}/produtos`)
      .then(res => res.json())
      .then(data => {
        // Verificar se os dados são um array antes de setar
        if (Array.isArray(data)) {
          setProdutos(data);
        } else {
          console.error('API retornou dados inválidos para produtos:', data);
          // Usar mock data como fallback
          setProdutos([
            { id: 1, codigo: '001', nome: 'Jornal Pet', categoria: 'Jornal', tipo: 'Consignado', preco: 10.00, estoque: 5, fornecedor: 'Distribuidora Azevedo' },
            { id: 2, codigo: '002', nome: 'Varejo 1,5', categoria: 'Varejo', tipo: 'Próprio', preco: 1.50, estoque: 15, fornecedor: '-' },
            { id: 3, codigo: '003', nome: 'Trident Tutti Fruti', categoria: 'Bomboniere', tipo: 'Consignado', preco: 3.50, estoque: 2, fornecedor: 'Distribuidora Doce' },
            { id: 4, codigo: '004', nome: 'A Tribuna', categoria: 'Jornal', tipo: 'Consignado', preco: 2.50, estoque: 8, fornecedor: 'Distribuidora Azevedo' },
            { id: 5, codigo: '005', nome: 'Varejo 1 real', categoria: 'Varejo', tipo: 'Próprio', preco: 1.00, estoque: 20, fornecedor: '-' },
          ]);
        }
      })
      .catch(error => {
        console.error('Erro ao carregar produtos:', error);
        // Mock data como fallback
        setProdutos([
          { id: 1, codigo: '001', nome: 'Jornal Pet', categoria: 'Jornal', tipo: 'Consignado', preco: 10.00, estoque: 5, fornecedor: 'Distribuidora Azevedo' },
          { id: 2, codigo: '002', nome: 'Varejo 1,5', categoria: 'Varejo', tipo: 'Próprio', preco: 1.50, estoque: 15, fornecedor: '-' },
          { id: 3, codigo: '003', nome: 'Trident Tutti Fruti', categoria: 'Bomboniere', tipo: 'Consignado', preco: 3.50, estoque: 2, fornecedor: 'Distribuidora Doce' },
          { id: 4, codigo: '004', nome: 'A Tribuna', categoria: 'Jornal', tipo: 'Consignado', preco: 2.50, estoque: 8, fornecedor: 'Distribuidora Azevedo' },
          { id: 5, codigo: '005', nome: 'Varejo 1 real', categoria: 'Varejo', tipo: 'Próprio', preco: 1.00, estoque: 20, fornecedor: '-' },
        ]);
      });

    // Carregar vendas recentes
    fetch(`${API_URL}/vendas?limit=5`)
      .then(res => res.json())
      .then(data => {
        // Verificar se os dados são um array antes de setar
        if (Array.isArray(data)) {
          setVendasRecentes(data);
        } else {
          console.error('API retornou dados inválidos para vendas recentes:', data);
          setVendasRecentes([]);
        }
      })
      .catch(error => {
        console.error('Erro ao carregar vendas recentes:', error);
        setVendasRecentes([]);
      });
  }, []);

  // Calcular totais da venda
  const subtotal = itensVenda.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
  const taxasPagamento = {
    dinheiro: 0,
    debito: 0.0167,
    credito: 0.0389,
    pix: 0
  };
  const taxa = taxasPagamento[formaPagamento] || 0;
  const valorTaxa = subtotal * taxa;
  const total = subtotal - valorTaxa;
  const troco = valorPagoCliente - total;

  // Calcular comissões de fornecedores (simulação para preview)
  const calcularComissoesFornecedores = () => {
    let totalComissoes = 0;
    const detalhesComissoes = [];
    
    itensVenda.forEach(item => {
      // Simulação - na prática viria do backend com dados reais do fornecedor
      const produto = Array.isArray(produtos) ? produtos.find(p => p.id === item.id) : null;
      if (produto && produto.fornecedorId) {
        // Distribuidora Azevedo recebe 80% da venda
        const comissaoPercentual = 80;
        const valorComissao = (item.preco * item.quantidade) * (comissaoPercentual / 100);
        totalComissoes += valorComissao;
        
        detalhesComissoes.push({
          nome: `Comissão Fornecedor`,
          valor: valorComissao
        });
      }
    });
    
    return { totalComissoes, detalhesComissoes };
  };

  const { totalComissoes, detalhesComissoes } = calcularComissoesFornecedores();
  const faturamento = total - valorTaxa; // Apenas taxa de pagamento
  const lucro = faturamento - totalComissoes; // Faturamento - comissões

  // Buscar produto por código de barras
  const buscarProdutoPorCodigo = (codigo) => {
    const produto = Array.isArray(produtos) ? produtos.find(p => p.codigoBarras === codigo) : null;
    if (produto) {
      adicionarItemVenda(produto, quantidade);
      setCodigoBarras('');
    } else {
      alert('Produto não encontrado!');
    }
  };

  // Buscar produto por nome
  const produtosFiltrados = Array.isArray(produtos) ? produtos.filter(p => 
    p.nome && p.nome.toLowerCase().includes(buscaProduto.toLowerCase())
  ) : [];

  // Adicionar item ao carrinho
  const adicionarItemVenda = (produto, quantidade) => {
    const itemExistente = itensVenda.find(item => item.id === produto.id);
    
    if (itemExistente) {
      setItensVenda(itensVenda.map(item => 
        item.id === produto.id 
          ? { ...item, quantidade: item.quantidade + quantidade }
          : item
      ));
    } else {
      setItensVenda([...itensVenda, {
        id: produto.id,
        nome: produto.nome,
        preco: produto.preco,
        quantidade: quantidade
      }]);
    }
    
    setQuantidade(1);
    setBuscaProduto('');
    setProdutoSelecionado(null);
  };

  // Remover item do carrinho
  const removerItemVenda = (itemId) => {
    setItensVenda(itensVenda.filter(item => item.id !== itemId));
  };

  // Atualizar quantidade do item
  const atualizarQuantidadeItem = (itemId, novaQuantidade) => {
    if (novaQuantidade <= 0) {
      removerItemVenda(itemId);
    } else {
      setItensVenda(itensVenda.map(item => 
        item.id === itemId 
          ? { ...item, quantidade: novaQuantidade }
          : item
      ));
    }
  };

  // Finalizar venda
  const finalizarVenda = async () => {
    if (itensVenda.length === 0) {
      alert('Adicione itens à venda antes de finalizar!');
      return;
    }

    if (formaPagamento === 'dinheiro' && valorPagoCliente < total) {
      alert('Valor pago pelo cliente é insuficiente!');
      return;
    }

    try {
      const vendaData = {
        total: total,
        desconto: 0,
        formaPagamento: formaPagamento,
        usuarioId: (() => {
          try {
            const savedUser = localStorage.getItem('authUser');
            if (!savedUser) return USUARIO_ID_DEFAULT;
            const user = JSON.parse(savedUser);
            const id = parseInt(user?.id, 10);
            return Number.isFinite(id) && id > 0 ? id : USUARIO_ID_DEFAULT;
          } catch (_e) {
            return USUARIO_ID_DEFAULT;
          }
        })(),
        itens: itensVenda
      };


      console.log('📤 Enviando dados da venda:', vendaData);

      const response = await fetch(`${API_URL}/vendas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(vendaData)
      });

      if (response.ok) {
        const venda = await response.json();
        console.log('📦 Resposta do backend:', venda);
        setUltimaVenda(venda);
        
        // Limpar carrinho
        setItensVenda([]);
        setValorPagoCliente(0);
        
        // Exibir resumo financeiro detalhado
        let mensagem = `✅ Venda finalizada com sucesso!\n\n`;
        mensagem += `💰 Total Bruto: R$ ${venda.resumoFinanceiro?.totalBruto?.toFixed(2) || total.toFixed(2)}\n`;
        
        if (venda.resumoFinanceiro?.taxaPagamento > 0) {
          mensagem += `💳 Taxa Pagamento: R$ ${venda.resumoFinanceiro.taxaPagamento.toFixed(2)}\n`;
        }
        
        if (venda.resumoFinanceiro?.comissoesFornecedores > 0) {
          mensagem += `🏭 Comissões Fornecedores: R$ ${venda.resumoFinanceiro.comissoesFornecedores.toFixed(2)}\n`;
        }
        
        mensagem += `📈 Faturamento: R$ ${venda.resumoFinanceiro?.faturamento?.toFixed(2) || faturamento.toFixed(2)}\n`;
        mensagem += `💵 Lucro Líquido: R$ ${venda.resumoFinanceiro?.lucro?.toFixed(2) || lucro.toFixed(2)}\n`;
        
        if (venda.resumoFinanceiro?.detalhesTaxas && venda.resumoFinanceiro.detalhesTaxas.length > 0) {
          mensagem += `\n📋 Detalhes das deduções:\n`;
          venda.resumoFinanceiro.detalhesTaxas.forEach((taxa, index) => {
            mensagem += `  • ${taxa.nome}: R$ ${taxa.valor.toFixed(2)}\n`;
          });
        }
        
        alert(mensagem);
        setShowFinalizarVenda(false);
        
        // Recarregar vendas recentes
        fetch(`${API_URL}/vendas?limit=5`)
          .then(res => res.json())
          .then(data => setVendasRecentes(data));
      } else {
        const errorData = await response.json();
        console.error('❌ Erro na resposta:', errorData);
        alert(`Erro ao finalizar venda: ${errorData.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('💥 Erro ao finalizar venda:', error);
      alert('Erro ao finalizar venda!');
    }
  };

  // Repetir última venda
  const repetirUltimaVenda = () => {
    if (ultimaVenda && ultimaVenda.itens) {
      setItensVenda(ultimaVenda.itens.map(item => ({
        id: item.produtoId,
        nome: item.produto.nome,
        preco: item.preco,
        quantidade: item.quantidade
      })));
    } else {
      alert('Não há venda anterior para repetir!');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Venda</h2>
        <div style={{
          background: '#1a3d2c',
          border: '1px solid #c3e6cb',
          borderRadius: '4px',
          padding: '8px 16px',
          color: '#155724',
          fontSize: '14px'
        }}>
          Caixa {statusCaixa === 'aberto' ? '✅ Aberto' : '❌ Fechado'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Coluna da Esquerda - Busca e Adição de Produtos */}
        <div>
          {/* Escanear Código de Barras */}
          <div style={{
            background: '#fff',
            border: '2px dashed #ddd',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px',
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#666' }}>📷 Escanear Código de Barras</h3>
            <input 
              type="text"
              placeholder="Digite ou escaneie o código"
              value={codigoBarras}
              onChange={(e) => setCodigoBarras(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  buscarProdutoPorCodigo(codigoBarras);
                }
              }}
              style={{
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                width: '100%'
              }}
            />
          </div>

          {/* Buscar Produto por Nome */}
          <div style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>🔍 Buscar Produto</h4>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <input 
                type="text"
                placeholder="Digite para buscar por nome..."
                value={buscaProduto}
                onChange={(e) => setBuscaProduto(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <label style={{ fontSize: '14px' }}>Qtd:</label>
                <input 
                  type="number"
                  min="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                  style={{
                    width: '60px',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            
            {/* Lista de produtos encontrados */}
            {buscaProduto && produtosFiltrados.length > 0 && (
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}>
                {produtosFiltrados.map(produto => (
                  <div
                    key={produto.id}
                    onClick={() => setProdutoSelecionado(produto)}
                    style={{
                      padding: '10px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      background: produtoSelecionado?.id === produto.id ? '#f0f8ff' : '#fff'
                    }}
                  >
                    <div style={{ fontWeight: 'bold' }}>{produto.nome}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      R$ {produto.preco.toFixed(2)} | Estoque: {produto.estoque}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {produtoSelecionado && (
              <button 
                onClick={() => adicionarItemVenda(produtoSelecionado, quantidade)}
                style={{
                  padding: '10px 20px',
                  background: '#007bff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  width: '100%',
                  marginTop: '10px'
                }}
              >
                Adicionar ao Carrinho
              </button>
            )}
          </div>

          {/* Vendas Recentes */}
          {vendasRecentes.length > 0 && (
            <div style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>📋 Vendas Recentes</h4>
              {vendasRecentes.map(venda => (
                <div key={venda.id} style={{
                  padding: '10px',
                  borderBottom: '1px solid #eee',
                  fontSize: '14px'
                }}>
                  <div style={{ fontWeight: 'bold' }}>
                    {new Date(venda.createdAt).toLocaleDateString()} {new Date(venda.createdAt).toLocaleTimeString()}
                  </div>
                  <div style={{ color: '#666' }}>
                    Total: R$ {venda.total.toFixed(2)} | {venda.itens?.length || 0} itens
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coluna da Direita - Carrinho e Finalização */}
        <div>
          {/* Carrinho de Compras */}
          <div style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>🛒 Carrinho</h4>
            
            {itensVenda.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#666',
                fontSize: '16px'
              }}>
                Carrinho vazio
              </div>
            ) : (
              <div>
                {itensVenda.map(item => (
                  <div key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    borderBottom: '1px solid #eee'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{item.nome}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        R$ {item.preco.toFixed(2)} x {item.quantidade} = R$ {(item.preco * item.quantidade).toFixed(2)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => atualizarQuantidadeItem(item.id, item.quantidade - 1)}
                        style={{
                          width: '30px',
                          height: '30px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          background: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        -
                      </button>
                      <span style={{ minWidth: '30px', textAlign: 'center' }}>{item.quantidade}</span>
                      <button
                        onClick={() => atualizarQuantidadeItem(item.id, item.quantidade + 1)}
                        style={{
                          width: '30px',
                          height: '30px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          background: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        +
                      </button>
                      <button
                        onClick={() => removerItemVenda(item.id)}
                        style={{
                          width: '30px',
                          height: '30px',
                          border: '1px solid #dc3545',
                          borderRadius: '4px',
                          background: '#dc3545',
                          color: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Resumo da Venda */}
                <div style={{
                  marginTop: '20px',
                  paddingTop: '20px',
                  borderTop: '2px solid #ddd'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>Subtotal:</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {taxa > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px', color: '#666' }}>
                      <span>Taxa ({(taxa * 100).toFixed(2)}%):</span>
                      <span>R$ {valorTaxa.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>
                    <span>Total:</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Forma de Pagamento */}
          <div style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>💳 Forma de Pagamento</h4>
            <select 
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="dinheiro">💵 Dinheiro - taxa 0.00%</option>
              <option value="debito">💳 Débito - taxa 1.67%</option>
              <option value="credito">💳 Crédito - taxa 3.89%</option>
              <option value="pix">📱 Pix - taxa 0.00%</option>
            </select>
          </div>

          {/* Valor pago pelo cliente */}
          {formaPagamento === 'dinheiro' && (
            <div style={{
              background: '#fff',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>💰 Valor pago pelo cliente</h4>
              <input 
                type="number"
                step="0.01"
                placeholder="Digite o valor recebido"
                value={valorPagoCliente || ''}
                onChange={(e) => setValorPagoCliente(parseFloat(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  marginBottom: '10px'
                }}
              />
              {valorPagoCliente > 0 && (
                <div style={{
                  background: troco >= 0 ? '#d4edda' : '#f8d7da',
                  padding: '10px',
                  borderRadius: '4px',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}>
                  Troco: R$ {troco.toFixed(2)}
                </div>
              )}
            </div>
          )}

          {/* Botões de ação */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={repetirUltimaVenda}
              disabled={!ultimaVenda}
              style={{
                flex: 1,
                padding: '12px 24px',
                background: ultimaVenda ? '#6c757d' : '#e9ecef',
                color: ultimaVenda ? '#fff' : '#6c757d',
                border: 'none',
                borderRadius: '4px',
                cursor: ultimaVenda ? 'pointer' : 'not-allowed',
                fontSize: '14px'
              }}
            >
              🔄 Repetir Última
            </button>
            <button 
              onClick={() => setShowFinalizarVenda(true)}
              disabled={itensVenda.length === 0}
              style={{
                flex: 2,
                padding: '12px 24px',
                background: itensVenda.length > 0 ? '#28a745' : '#e9ecef',
                color: itensVenda.length > 0 ? '#fff' : '#6c757d',
                border: 'none',
                borderRadius: '4px',
                cursor: itensVenda.length > 0 ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              💵 Finalizar Venda
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Venda */}
      {showFinalizarVenda && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            padding: '30px',
            borderRadius: '8px',
            width: '500px',
            textAlign: 'left'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333', textAlign: 'center' }}>📋 Confirmar Venda</h3>
            
            {/* Resumo Básico */}
            <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span><strong>Total Bruto:</strong></span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span><strong>Forma de Pagamento:</strong></span>
                <span>{formaPagamento.charAt(0).toUpperCase() + formaPagamento.slice(1)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span><strong>Quantidade de Itens:</strong></span>
                <span>{itensVenda.length}</span>
              </div>
              {formaPagamento === 'dinheiro' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span><strong>Troco:</strong></span>
                  <span style={{ color: troco >= 0 ? '#28a745' : '#dc3545' }}>
                    R$ {troco.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Detalhes das Deduções */}
            {(valorTaxa > 0 || totalComissoes > 0) && (
              <div style={{ marginBottom: '20px', padding: '15px', background: '#fff3cd', borderRadius: '4px', border: '1px solid #ffeaa7' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#856404', fontSize: '14px' }}>📊 Deduções Automáticas</h4>
                
                {valorTaxa > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px' }}>
                    <span>Taxa {formaPagamento.charAt(0).toUpperCase() + formaPagamento.slice(1)} ({(taxa * 100).toFixed(2)}%):</span>
                    <span style={{ color: '#dc3545' }}>-R$ {valorTaxa.toFixed(2)}</span>
                  </div>
                )}
                
                {detalhesComissoes.map((comissao, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px' }}>
                    <span>{comissao.nome}:</span>
                    <span style={{ color: '#dc3545' }}>-R$ {comissao.valor.toFixed(2)}</span>
                  </div>
                ))}
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginTop: '10px', 
                  paddingTop: '10px', 
                  borderTop: '1px solid #ffeaa7',
                  fontWeight: 'bold'
                }}>
                  <span>Total de Deduções:</span>
                  <span style={{ color: '#dc3545' }}>R$ {(valorTaxa + totalComissoes).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Resumo Financeiro */}
            <div style={{ marginBottom: '20px', padding: '15px', background: '#1a3d2c', borderRadius: '4px', border: '1px solid #c3e6cb' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#155724', fontSize: '14px' }}>💰 Resumo Financeiro</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '15px', fontWeight: 'bold' }}>
                <span>📈 Faturamento:</span>
                <span style={{ color: '#155724' }}>R$ {faturamento.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', paddingTop: '8px', borderTop: '1px solid #c3e6cb' }}>
                <span>💵 Lucro Líquido:</span>
                <span style={{ color: '#155724' }}>R$ {lucro.toFixed(2)}</span>
              </div>
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowFinalizarVenda(false)}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={finalizarVenda}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: '#28a745',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                ✅ Confirmar Venda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Caixa() {
  const [caixaAberto, setCaixaAberto] = useState(true);
  const [historicoCaixas, setHistoricoCaixas] = useState([]);
  const [resumoCaixa, setResumoCaixa] = useState(null);
  const [loading, setLoading] = useState(false);
  const [valoresFechamento, setValoresFechamento] = useState({
    dinheiro: '',
    pix: '',
    cartaoDebito: '',
    cartaoCredito: '',
    observacao: ''
  });

  useEffect(() => {
    // Carregar histórico de caixas
    setHistoricoCaixas([
      { id: 1, abertura: '08/05/2026, 07:44:39', fechamento: '-', operador: 'Banca No Ponto', status: 'Aberto', saldoInicial: 3.00, saldoFinal: '-', diferenca: '-' },
      { id: 2, abertura: '07/05/2026, 13:33:01', fechamento: '07/05/2026, 18:33:11', operador: 'Banca No Ponto', status: 'Fechado', saldoInicial: 221.24, saldoFinal: 440.00, diferenca: 218.76 },
    ]);

    // Carregar resumo do caixa do dia
    carregarResumoCaixa();
  }, []);

  const carregarResumoCaixa = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/vendas/resumo/hoje`);
      if (response.ok) {
        const data = await response.json();
        setResumoCaixa(data);
        console.log('📊 Resumo do caixa carregado:', data);
      }
    } catch (error) {
      console.error('Erro ao carregar resumo do caixa:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularDiferencas = () => {
    if (!resumoCaixa) return {};

    const diferencaDinheiro = parseFloat(valoresFechamento.dinheiro || 0) - resumoCaixa.porPagamento.dinheiro.total;
    const diferencaPix = parseFloat(valoresFechamento.pix || 0) - resumoCaixa.porPagamento.pix.total;
    const diferencaDebito = parseFloat(valoresFechamento.cartaoDebito || 0) - resumoCaixa.porPagamento.debito.total;
    const diferencaCredito = parseFloat(valoresFechamento.cartaoCredito || 0) - resumoCaixa.porPagamento.credito.total;
    
    const totalApurado = parseFloat(valoresFechamento.dinheiro || 0) + 
                        parseFloat(valoresFechamento.pix || 0) + 
                        parseFloat(valoresFechamento.cartaoDebito || 0) + 
                        parseFloat(valoresFechamento.cartaoCredito || 0);
    
    const totalPrevisto = resumoCaixa.totais.geral;
    const diferencaTotal = totalApurado - totalPrevisto;

    return {
      dinheiro: diferencaDinheiro,
      pix: diferencaPix,
      debito: diferencaDebito,
      credito: diferencaCredito,
      total: diferencaTotal,
      apurado: totalApurado,
      previsto: totalPrevisto
    };
  };

  const fecharCaixa = () => {
    const diferenca = calcularDiferencas();
    
    if (!window.confirm(`Tem certeza que deseja fechar o caixa?\n\nTotal Apurado: R$ ${diferenca.apurado.toFixed(2)}\nTotal Previsto: R$ ${diferenca.previsto.toFixed(2)}\nDiferença: R$ ${diferenca.total.toFixed(2)}`)) {
      return;
    }

    // Simulação de fechamento
    setCaixaAberto(false);
    alert(`✅ Caixa fechado com sucesso!\n\nTotal Apurado: R$ ${diferenca.apurado.toFixed(2)}\nTotal Previsto: R$ ${diferenca.previsto.toFixed(2)}\nDiferença: R$ ${diferenca.total.toFixed(2)}\n\nObservação: ${valoresFechamento.observacao || 'Nenhuma'}`);
    
    // Aqui seria implementada a lógica real de salvar no backend
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Carregando dados do caixa...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>🏪 Gestão de Caixa</h2>

      {caixaAberto && resumoCaixa && (
        <div style={{ marginBottom: '30px' }}>
          {/* Status do Caixa */}
          <div style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📊 Status do Caixa</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <strong>Data:</strong> {resumoCaixa.data}
              </div>
              <div>
                <strong>Período:</strong> {resumoCaixa.periodo.inicio} - {resumoCaixa.periodo.fim}
              </div>
              <div>
                <strong>Vendas:</strong> {resumoCaixa.totais.quantidadeVendas}
              </div>
              <div>
                <strong>Operador:</strong> Banca No Ponto
              </div>
            </div>
          </div>

          {/* Resumo por Forma de Pagamento */}
          <div style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>💰 Resumo por Forma de Pagamento</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              {/* Dinheiro */}
              <div style={{ padding: '15px', background: '#1a3d2c', borderRadius: '8px', border: '1px solid #c3e6cb' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>💵 Dinheiro</h4>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#155724' }}>
                  R$ {resumoCaixa.porPagamento.dinheiro.total.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  {resumoCaixa.porPagamento.dinheiro.quantidade} vendas
                </div>
              </div>

              {/* Pix */}
              <div style={{ padding: '15px', background: '#cce5ff', borderRadius: '8px', border: '1px solid #99d6ff' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#004085' }}>📱 Pix</h4>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#004085' }}>
                  R$ {resumoCaixa.porPagamento.pix.total.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  {resumoCaixa.porPagamento.pix.quantidade} vendas
                </div>
              </div>

              {/* Cartão Débito */}
              <div style={{ padding: '15px', background: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>💳 Débito</h4>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#856404' }}>
                  R$ {resumoCaixa.porPagamento.debito.total.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  {resumoCaixa.porPagamento.debito.quantidade} vendas
                </div>
              </div>

              {/* Cartão Crédito */}
              <div style={{ padding: '15px', background: '#f8d7da', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#721c24' }}>💳 Crédito</h4>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#721c24' }}>
                  R$ {resumoCaixa.porPagamento.credito.total.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                  {resumoCaixa.porPagamento.credito.quantidade} vendas
                </div>
              </div>
            </div>

            {/* Totais Gerais */}
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              background: '#f8f9fa', 
              borderRadius: '8px', 
              border: '1px solid #dee2e6' 
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div>
                  <strong>Total Geral:</strong>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>
                    R$ {resumoCaixa.totais.geral.toFixed(2)}
                  </div>
                </div>
                <div>
                  <strong>Faturamento:</strong>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#28a745' }}>
                    R$ {resumoCaixa.totais.faturamento.toFixed(2)}
                  </div>
                </div>
                <div>
                  <strong>Lucro Líquido:</strong>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#17a2b8' }}>
                    R$ {resumoCaixa.totais.lucro.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conferência de Caixa */}
          <div style={{
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🔍 Conferência de Caixa</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>💵 Dinheiro Apurado:</label>
                <input 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={valoresFechamento.dinheiro}
                  onChange={(e) => setValoresFechamento({...valoresFechamento, dinheiro: e.target.value})}
                  style={{ 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    width: '100%',
                    fontSize: '14px'
                  }} 
                />
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                  Previsto: R$ {resumoCaixa.porPagamento.dinheiro.total.toFixed(2)}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>📱 Pix Apurado:</label>
                <input 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={valoresFechamento.pix}
                  onChange={(e) => setValoresFechamento({...valoresFechamento, pix: e.target.value})}
                  style={{ 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    width: '100%',
                    fontSize: '14px'
                  }} 
                />
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                  Previsto: R$ {resumoCaixa.porPagamento.pix.total.toFixed(2)}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>💳 Débito Apurado:</label>
                <input 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={valoresFechamento.cartaoDebito}
                  onChange={(e) => setValoresFechamento({...valoresFechamento, cartaoDebito: e.target.value})}
                  style={{ 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    width: '100%',
                    fontSize: '14px'
                  }} 
                />
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                  Previsto: R$ {resumoCaixa.porPagamento.debito.total.toFixed(2)}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>💳 Crédito Apurado:</label>
                <input 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={valoresFechamento.cartaoCredito}
                  onChange={(e) => setValoresFechamento({...valoresFechamento, cartaoCredito: e.target.value})}
                  style={{ 
                    padding: '10px', 
                    border: '1px solid #ddd', 
                    borderRadius: '4px',
                    width: '100%',
                    fontSize: '14px'
                  }} 
                />
                <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '2px' }}>
                  Previsto: R$ {resumoCaixa.porPagamento.credito.total.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Diferenças Calculadas */}
            {(valoresFechamento.dinheiro || valoresFechamento.pix || valoresFechamento.cartaoDebito || valoresFechamento.cartaoCredito) && (
              <div style={{ 
                marginBottom: '20px',
                padding: '15px', 
                background: '#fff3cd', 
                borderRadius: '8px', 
                border: '1px solid #ffeaa7' 
              }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>📊 Diferenças</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                  <div style={{ fontSize: '13px' }}>
                    <strong>Dinheiro:</strong> 
                    <span style={{ color: calcularDiferencas().dinheiro >= 0 ? '#28a745' : '#dc3545' }}>
                      R$ {calcularDiferencas().dinheiro.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    <strong>Pix:</strong> 
                    <span style={{ color: calcularDiferencas().pix >= 0 ? '#28a745' : '#dc3545' }}>
                      R$ {calcularDiferencas().pix.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    <strong>Débito:</strong> 
                    <span style={{ color: calcularDiferencas().debito >= 0 ? '#28a745' : '#dc3545' }}>
                      R$ {calcularDiferencas().debito.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px' }}>
                    <strong>Crédito:</strong> 
                    <span style={{ color: calcularDiferencas().credito >= 0 ? '#28a745' : '#dc3545' }}>
                      R$ {calcularDiferencas().credito.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div style={{ 
                  marginTop: '10px', 
                  paddingTop: '10px', 
                  borderTop: '1px solid #ffeaa7',
                  fontWeight: 'bold'
                }}>
                  Diferença Total: 
                  <span style={{ color: calcularDiferencas().total >= 0 ? '#28a745' : '#dc3545' }}>
                    R$ {calcularDiferencas().total.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: '10px', marginBottom: '15px' }}>
              <input 
                type="text" 
                placeholder="Observação de Fechamento" 
                value={valoresFechamento.observacao}
                onChange={(e) => setValoresFechamento({...valoresFechamento, observacao: e.target.value})}
                style={{ 
                  padding: '10px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }} 
              />
            </div>

            <button 
              onClick={fecharCaixa}
              style={{
                padding: '12px 24px',
                background: '#dc3545',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              🔒 Fechar Caixa
            </button>
          </div>
        </div>
      )}

      {/* Histórico de Caixas */}
      <div style={{
        background: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>📋 Histórico de Caixas</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Abertura</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Fechamento</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Operador</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Saldo Inicial</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Saldo Final</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Diferença</th>
            </tr>
          </thead>
          <tbody>
            {historicoCaixas.map(caixa => (
              <tr key={caixa.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px', fontSize: '14px' }}>{caixa.abertura}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{caixa.fechamento}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{caixa.operador}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    background: caixa.status === 'Aberto' ? '#28a745' : '#6c757d',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {caixa.status}
                  </span>
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>R$ {caixa.saldoInicial.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>{caixa.saldoFinal === '-' ? '-' : `R$ ${caixa.saldoFinal.toFixed(2)}`}</td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>{caixa.diferenca === '-' ? '-' : `R$ ${caixa.diferenca.toFixed(2)}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);

  useEffect(() => {
    setUsuarios([
      { id: 3, nome: 'Banca No Ponto', email: 'admin@banca.com', perfil: 'Admin', status: 'Aprovado', dataCadastro: '29/04/2026' },
    ]);
  }, []);

  const getPerfilBadge = (perfil) => {
    return (
      <span style={{
        background: '#e91e63',
        color: '#fff',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        👑 {perfil}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    return (
      <span style={{
        background: '#28a745',
        color: '#fff',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        ✓ {status}
      </span>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Gerenciamento de Usuários</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => alert('Filtrar usuários pendentes será implementado em breve!')}
          style={{
            padding: '10px 15px',
            marginRight: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: 'transparent',
            cursor: 'pointer'
          }}>Pendentes (0)</button>
        <button 
          onClick={() => alert('Mostrar todos os usuários será implementado em breve!')}
          style={{
            padding: '10px 15px',
            border: '1px solid #007bff',
            borderRadius: '4px',
            background: '#007bff',
            color: '#fff',
            cursor: 'pointer'
          }}>Todos os Usuários</button>
      </div>

      <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Todos os Usuários</h3>
      
      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Nome</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Email</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Perfil</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Data de Cadastro</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(usuario => (
              <tr key={usuario.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px', fontSize: '14px' }}>{usuario.id}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{usuario.nome}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{usuario.email}</td>
                <td style={{ padding: '12px' }}>{getPerfilBadge(usuario.perfil)}</td>
                <td style={{ padding: '12px' }}>{getStatusBadge(usuario.status)}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{usuario.dataCadastro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CancelVendas() {
  const [vendas, setVendas] = useState([]);

  useEffect(() => {
    const fetchVendas = async () => {
      try {
        const response = await fetch(`${API_URL}/vendas`);
        const data = await response.json();
        setVendas(data);
      } catch (error) {
        console.error('Erro ao carregar vendas:', error);
      }
    };
    fetchVendas();
  }, []);

  const handleCancelarVenda = async (vendaId) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta venda? O estoque será restaurado e a venda será deletada.')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/vendas/${vendaId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Refresh the list
        const fetchVendas = async () => {
          const response = await fetch(`${API_URL}/vendas`);
          const data = await response.json();
          setVendas(data);
        };
        fetchVendas();
        alert('Venda cancelada com sucesso!');
      } else {
        alert('Erro ao cancelar venda');
      }
    } catch (error) {
      console.error('Erro ao cancelar venda:', error);
      alert('Erro ao cancelar venda');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Manutenção de Vendas - Cancelamentos</h2>
      
      <div style={{
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '4px',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ fontSize: '20px' }}>⚠️</span>
        <span>Cancelar = restaura estoque + deleta movimentações.</span>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Data</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Itens</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Total</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Lucro</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {vendas.map(venda => (
              <tr key={venda.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px', fontSize: '14px' }}>
                  {new Date(venda.createdAt).toLocaleString('pt-BR')}
                </td>
                <td style={{ padding: '12px', fontSize: '14px' }}>
                  {venda.itens?.map(item => item.produto?.nome).join(', ') || '-'}
                </td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>R$ {(venda.total ?? 0).toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right', fontSize: '14px' }}>R$ {(venda.lucro ?? 0).toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'center' }}>
                  <button
                    onClick={() => handleCancelarVenda(venda.id)}
                    style={{
                      padding: '6px 12px',
                      background: '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Cancelar Venda
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TaxasPagamento() {
  const [formasPagamento, setFormasPagamento] = useState([]);
  const [formData, setFormData] = useState({ forma: '', taxa: '', status: 'Ativa' });
  const [editandoId, setEditandoId] = useState(null);

  // Funções para CRUD de formas de pagamento
  const handleEditarForma = (forma) => {
    setFormData({
      forma: forma.forma,
      taxa: forma.taxa.toString(),
      status: forma.status
    });
    setEditandoId(forma.id);
  };

  const handleDesativarForma = (forma) => {
    if (window.confirm(`Tem certeza que deseja desativar a forma "${forma.forma}"?`)) {
      // Aqui seria implementada a lógica real de desativar no backend
      alert('Funcionalidade de desativar forma de pagamento será implementada em breve!');
    }
  };

  const handleRemoverForma = (forma) => {
    if (window.confirm(`Tem certeza que deseja remover a forma "${forma.forma}"?`)) {
      // Aqui seria implementada a lógica real de remover no backend
      setFormasPagamento(formasPagamento.filter(f => f.id !== forma.id));
      alert('Forma de pagamento removida com sucesso!');
    }
  };

  const handleSalvarForma = () => {
    if (!formData.forma || !formData.taxa) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }

    if (editandoId) {
      // Editar forma existente
      setFormasPagamento(formasPagamento.map(f => 
        f.id === editandoId 
          ? { ...f, ...formData, taxa: parseFloat(formData.taxa) }
          : f
      ));
      alert('Forma de pagamento atualizada com sucesso!');
    } else {
      // Adicionar nova forma
      const novaForma = {
        id: Math.max(...formasPagamento.map(f => f.id), 0) + 1,
        ...formData,
        taxa: parseFloat(formData.taxa)
      };
      setFormasPagamento([...formasPagamento, novaForma]);
      alert('Forma de pagamento adicionada com sucesso!');
    }

    // Resetar formulário
    setFormData({ forma: '', taxa: '', status: 'Ativa' });
    setEditandoId(null);
  };

  useEffect(() => {
    setFormasPagamento([
      { id: 1, forma: 'Credito', taxa: 3.89, status: 'Ativa' },
      { id: 2, forma: 'Debito', taxa: 1.67, status: 'Ativa' },
      { id: 3, forma: 'Dinheiro', taxa: 0.00, status: 'Ativa' },
      { id: 4, forma: 'Pix', taxa: 0.00, status: 'Ativa' },
      { id: 5, forma: 'Vale', taxa: 20.00, status: 'Ativa' },
    ]);
  }, []);

  return (
    <>
      <div style={{ padding: '20px' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Manutencao de Taxas</h2>

        <div style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Nova Forma de Pagamento</h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Forma de pagamento *</label>
              <input 
                type="text"
                placeholder="Ex: Dinheiro, Debito, Credito"
                value={formData.forma}
                onChange={(e) => setFormData({...formData, forma: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Taxa (%) *</label>
              <input 
                type="number"
                step="0.01"
                placeholder="Ex: 1.67"
                value={formData.taxa}
                onChange={(e) => setFormData({...formData, taxa: parseFloat(e.target.value)})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="Ativa">Ativa</option>
                <option value="Inativa">Inativa</option>
              </select>
            </div>
            <button 
              onClick={handleSalvarForma}
              style={{
                padding: '10px 20px',
                background: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px'
              }}>
              {editandoId ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Forma</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Taxa</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {formasPagamento.map(forma => (
              <tr key={forma.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px', fontSize: '14px' }}>{forma.forma}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{forma.taxa.toFixed(2)}%</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    background: '#28a745',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {forma.status}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                    <button 
                      onClick={() => handleEditarForma(forma)}
                      style={{
                        padding: '4px 8px',
                        background: '#6c757d',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}>Editar</button>
                    <button 
                      onClick={() => handleDesativarForma(forma)}
                      style={{
                        padding: '4px 8px',
                        background: '#ffc107',
                        color: '#000',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}>Desativar</button>
                    <button 
                      onClick={() => handleRemoverForma(forma)}
                      style={{
                        padding: '4px 8px',
                        background: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '3px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}>Remover</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function LogsAuditoria() {
  const [logs, setLogs] = useState([]);
  const [entidadeFiltro, setEntidadeFiltro] = useState('Todas');
  const [acaoFiltro, setAcaoFiltro] = useState('Todas');
  const [limite, setLimite] = useState('50');

  useEffect(() => {
    setLogs([
      { id: 1, data: '08/05/2026, 09:36:12', usuario: 'Banca No Ponto', acao: '+ CREATE', entidade: 'Venda', idRegistro: '-', ip: ':1' },
      { id: 2, data: '08/05/2026, 09:35:08', usuario: 'Banca No Ponto', acao: '+ CREATE', entidade: 'Movimentacao', idRegistro: '-', ip: ':1' },
      { id: 3, data: '08/05/2026, 09:20:42', usuario: 'Banca No Ponto', acao: '+ CREATE', entidade: 'Venda', idRegistro: '-', ip: ':1' },
    ]);
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>Logs de Auditoria</h2>

      <div style={{
        background: '#fff',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '15px',
        alignItems: 'center'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Entidade</label>
          <select 
            value={entidadeFiltro}
            onChange={(e) => setEntidadeFiltro(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="Todas">Todas</option>
            <option value="Venda">Venda</option>
            <option value="Movimentacao">Movimentacao</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Ação</label>
          <select 
            value={acaoFiltro}
            onChange={(e) => setAcaoFiltro(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="Todas">Todas</option>
            <option value="+ CREATE">+ CREATE</option>
            <option value="- DELETE">- DELETE</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Limite</label>
          <select 
            value={limite}
            onChange={(e) => setLimite(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
          </select>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Data</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Usuário</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Ação</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>Entidade</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', fontSize: '14px', fontWeight: '600' }}>IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={log.id} style={{ background: index % 2 === 0 ? '#fff' : '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                <td style={{ padding: '12px', fontSize: '14px' }}>{log.data}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{log.usuario}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    background: '#007bff',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {log.acao}
                  </span>
                </td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{log.entidade}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{log.idRegistro}</td>
                <td style={{ padding: '12px', fontSize: '14px' }}>{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Sidebar({ activePage, setActivePage, isMobile, isSidebarOpen, setIsSidebarOpen }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'produtos', label: 'Produtos', icon: '📦' },
    { id: 'fornecedores', label: 'Fornecedores', icon: '🏭' },
    { id: 'movimentacoes', label: 'Movimentações', icon: '🔄' },
    { id: 'saidas', label: 'Saídas', icon: '📤' },
    { id: 'entradas', label: 'Entradas', icon: '📥' },
    { id: 'vendas', label: 'Vendas', icon: '💰' },
    { id: 'caixa', label: 'Caixa', icon: '💳' },
    { id: 'usuarios', label: 'Usuários', icon: '👥' },
  ];

  const maintenanceItems = [
    { id: 'cancel-vendas', label: 'Cancel Vendas', icon: '❌' },
    { id: 'taxas-pagamento', label: 'Taxas Pagamento', icon: '💸' },
    { id: 'logs-auditoria', label: 'Logs Auditoria', icon: '📋' },
  ];

  const sidebarStyle = {
    width: isMobile ? (isSidebarOpen ? '250px' : '0') : '250px',
    background: '#1a3d2c',
    height: '100vh',
    position: 'fixed',
    left: 0,
    top: 0,
    paddingTop: '20px',
    transition: 'width 0.3s ease',
    zIndex: 1000,
    overflow: isMobile ? 'hidden' : 'visible',
    maxWidth: '250px' // Evita que a sidebar ultrapasse em telas pequenas
  };

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          style={{
            position: 'fixed',
            top: '10px',
            left: '10px',
            zIndex: 1001,
            background: '#2c3e50',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 12px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {isSidebarOpen ? '✕' : '☰'}
        </button>
      )}
      
      <div style={sidebarStyle}>
        <h3 style={{ 
          color: '#fff', 
          textAlign: 'center', 
          marginBottom: '30px',
          fontSize: isMobile ? '16px' : '18px'
        }}>
          {isSidebarOpen || !isMobile ? 'Banca no Ponto' : ''}
        </h3>
        
        {(!isMobile || isSidebarOpen) && (
          <>
            <div style={{ marginBottom: '30px' }}>
              {menuItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  style={{
                    padding: isMobile ? '10px 15px' : '12px 20px',
                    color: activePage === item.id ? '#fff' : '#bdc3c7',
                    cursor: 'pointer',
                    background: activePage === item.id ? '#3498db' : 'transparent',
                    transition: 'background 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: isMobile ? '14px' : '13px'
                  }}
                  onMouseEnter={(e) => {
                    if (activePage !== item.id) {
                      e.target.style.background = '#34495e';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activePage !== item.id) {
                      e.target.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: isMobile ? '16px' : '14px' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid #34495e', paddingTop: '20px' }}>
              <h4 style={{ 
                color: '#95a5a6', 
                padding: '0 15px', 
                marginBottom: '10px', 
                fontSize: '12px', 
                textTransform: 'uppercase' 
              }}>
                Manutenção
              </h4>
              {maintenanceItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActivePage(item.id);
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  style={{
                    padding: isMobile ? '15px 20px' : '10px 20px',
                    color: activePage === item.id ? '#fff' : '#95a5a6',
                    cursor: 'pointer',
                    background: activePage === item.id ? '#e74c3c' : 'transparent',
                    transition: 'background 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: isMobile ? '13px' : '12px'
                  }}
                  onMouseEnter={(e) => {
                    if (activePage !== item.id) {
                      e.target.style.background = '#34495e';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activePage !== item.id) {
                      e.target.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ fontSize: isMobile ? '14px' : '12px' }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(false);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderPage = () => {
    switch(activePage) {
      case 'dashboard': return <Dashboard isMobile={isMobile} />;
      case 'produtos': return <Produtos isMobile={isMobile} />;
      case 'fornecedores': return <Fornecedores isMobile={isMobile} />;
      case 'movimentacoes': return <Movimentacoes isMobile={isMobile} />;
      case 'saidas': return <Saidas isMobile={isMobile} />;
      case 'entradas': return <Entradas isMobile={isMobile} />;
      case 'vendas': return <VendaPage isMobile={isMobile} />;
      case 'caixa': return <Caixa isMobile={isMobile} />;
      case 'usuarios': return <Usuarios isMobile={isMobile} />;
      case 'cancel-vendas': return <CancelVendas isMobile={isMobile} />;
      case 'taxas-pagamento': return <TaxasPagamento isMobile={isMobile} />;
      case 'logs-auditoria': return <LogsAuditoria isMobile={isMobile} />;
      default: return <Dashboard isMobile={isMobile} />;
    }
  };

  const mainContentStyle = {
    marginLeft: isMobile ? '0' : '250px',
    flex: 1,
    transition: 'margin-left 0.3s ease',
    minHeight: '100vh',
    background: '#f5f5f5'
  };

  return (
    <div style={{ display: 'flex', background: '#f5f5f5', minHeight: '100vh' }}>
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div style={mainContentStyle}>
        {renderPage()}
      </div>
    </div>
  );
}

