import React, { useState, useEffect } from 'react';
import { Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie } from 'recharts';
import { vendaService } from '../services/api';

const SalesChart = ({ isMobile = false }) => {
  const [vendas, setVendas] = useState([]);
  const [periodo, setPeriodo] = useState('hoje');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const carregarVendas = async () => {
      try {
        setLoading(true);
        setError(null);
        
        let url = '/vendas';
        if (periodo === 'semana') {
          const dataInicio = new Date();
          dataInicio.setDate(dataInicio.getDate() - 7);
          url += `?dataInicio=${dataInicio.toISOString().split('T')[0]}`;
        } else if (periodo === 'mes') {
          const dataInicio = new Date();
          dataInicio.setDate(dataInicio.getDate() - 30);
          url += `?dataInicio=${dataInicio.toISOString().split('T')[0]}`;
        }
        
        const data = await vendaService.getResumoHoje();
        
        if (periodo === 'hoje') {
          setVendas(data.vendas || []);
        } else {
          setVendas(data.vendas || []);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erro ao carregar vendas:', err);
        setError('Falha ao carregar dados de vendas');
        setLoading(false);
      }
    };

    carregarVendas();
  }, [periodo]);

  const processarDadosGrafico = () => {
    if (!vendas || vendas.length === 0) {
      return {
        dadosPorForma: [],
        dadosPorHora: [],
        totalGeral: 0
      };
    }

    // Agrupar vendas por forma de pagamento
    const dadosPorForma = [
      { forma: 'Dinheiro', total: 0, quantidade: 0, cor: '#22c55e' },
      { forma: 'Débito', total: 0, quantidade: 0, cor: '#3498db' },
      { forma: 'Crédito',total: 0, quantidade: 0, cor: '#9333ea' },
      { forma: 'Pix', total: 0, quantidade: 0, cor: '#8b5cf6' }
    ];

    vendas.forEach(venda => {
      const forma = venda.porPagamento || 'Dinheiro';
      const index = dadosPorForma.findIndex(d => d.forma === forma);
      
      if (index !== -1) {
        dadosPorForma[index].total += venda.total || 0;
        dadosPorForma[index].quantidade += 1;
      }
    });

    // Agrupar vendas por hora (últimas 24 horas)
    const agora = new Date();
    const umDiaAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
    
    const dadosPorHora = [];
    for (let i = 0; i < 24; i++) {
      const hora = i;
      const vendasHora = vendas.filter(venda => {
        const vendaData = new Date(venda.createdAt);
        return vendaData >= umDiaAtras && vendaData.getHours() === hora;
      });

      dadosPorHora.push({
        hora: `${hora.toString().padStart(2, '0')}:00`,
        total: vendasHora.reduce((sum, v) => sum + (v.total || 0), 0),
        quantidade: vendasHora.length
      });
    }

    const totalGeral = dadosPorForma.reduce((sum, d) => sum + d.total, 0);

    return {
      dadosPorForma,
      dadosPorHora,
      totalGeral
    };
  };

  const dadosGrafico = processarDadosGrafico();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>
          📊 Carregando dados de vendas...
        </div>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: '4px solid #3498db', 
          borderTop: '4px solid #f3f3f3',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ 
          fontSize: '18px', 
          color: '#dc3545',
          marginBottom: '10px' 
        }}>
          ❌ Erro ao carregar vendas
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '10px' : '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: isMobile ? 'wrap' : 'nowrap'
      }}>
        <h2 style={{ fontSize: isMobile ? '18px' : '24px', margin: 0 }}>
          📊 Relatório de Vendas
        </h2>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={periodo} 
            onChange={(e) => setPeriodo(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              fontSize: isMobile ? '14px' : '16px'
            }}
          >
            <option value="hoje">Hoje</option>
            <option value="semana">Última Semana</option>
            <option value="mes">Último Mês</option>
          </select>
        </div>
      </div>

      {/* Gráfico de Pizza - Vendas por Forma de Pagamento */}
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h3 style={{ fontSize: isMobile ? '16px' : '18px', marginBottom: '15px' }}>
          Vendas por Forma de Pagamento
        </h3>
        
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={dadosGrafico.dadosPorForma.map(d => ({
                name: d.forma,
                value: d.total,
                fill: d.cor
              }))}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent, value }) => {
                const valorFormatado = new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(value);
                
                return `${name}: R$ ${valorFormatado}`;
              }}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Barras - Vendas por Hora */}
      {!isMobile && (
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>
            Vendas por Hora (Últimas 24h)
          </h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dadosGrafico.dadosPorHora}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hora" 
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload) {
                    return (
                      <div style={{ 
                        background: 'rgba(0, 0, 0, 0.8)', 
                        border: '1px solid #ccc', 
                        padding: '8px', 
                        borderRadius: '4px'
                      }}>
                        <strong>{payload.hora}</strong><br/>
                        Total: R$ {payload.total.toFixed(2)}
                        <br/>
                        Vendas: {payload.quantidade}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Resumo Geral */}
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: isMobile ? '16px' : '18px', marginBottom: '10px' }}>
            📈 Resumo Geral
          </h3>
          <div style={{ fontSize: isMobile ? '24px' : '32px', fontWeight: 'bold', color: '#2c3e50' }}>
            R$ {dadosGrafico.totalGeral.toFixed(2)}
          </div>
          <div style={{ fontSize: isMobile ? '14px' : '16px', color: '#666' }}>
            Total de {vendas.length} vendas
          </div>
        </div>
        
        {dadosPorForma.map((forma, index) => (
          <div key={index} style={{ 
            background: 'white', 
            padding: '15px', 
            borderRadius: '8px',
            border: `1px solid ${forma.cor}`,
            borderLeft: `4px solid ${forma.cor}`
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '5px'
            }}>
              <span style={{ color: forma.cor, fontWeight: 'bold' }}>
                {forma.forma}
              </span>
              <span style={{ color: '#666' }}>
                ({forma.quantidade} vendas)
              </span>
            </div>
            <div style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold' }}>
              R$ {forma.total.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesChart;
