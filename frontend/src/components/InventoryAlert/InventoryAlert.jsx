import React, { useState, useEffect } from 'react';
import { productService } from '../services/api';
import './InventoryAlert.css';

const InventoryAlert = ({ isMobile = false }) => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const carregarProdutosComEstoqueBaixo = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const todosProdutos = await productService.getAll();
        
        // Filtrar produtos com estoque baixo
        const produtosComEstoqueBaixo = todosProdutos.filter(produto => 
          produto.estoque <= 5
        );
        
        setProdutos(produtosComEstoqueBaixo);
        setLoading(false);
        
        // Notificar usuário
        if (produtosComEstoqueBaixo.length > 0) {
          const mensagem = `⚠️ ATENÇÃO: Você tem ${produtosComEstoqueBaixo.length} produto(s) com estoque baixo!`;
          
          // Enviar notificação para o navegador
          if ('Notification' in window) {
            new Notification(mensagem, {
              icon: '⚠️',
              body: `Verifique os produtos:\n${produtosComEstoqueBaixo.map(p => `- ${p.nome} (Estoque: ${p.estoque})`).join('\n')}`,
              tag: 'inventory-alert'
            });
          } else {
            console.log('Notificação:', mensagem);
            alert(mensagem);
          }
        }
        
      } catch (err) {
        console.error('Erro ao carregar produtos:', err);
        setError('Falha ao carregar produtos');
        setLoading(false);
      }
    };

    carregarProdutosComEstoqueBaixo();
    
    // Atualizar a cada 30 segundos
    const intervalo = setInterval(carregarProdutosComEstoqueBaixo, 30000);
    
    return () => {
      clearInterval(intervalo);
    };
  };

  return (
    <div className={`inventory-alert ${isMobile ? 'inventory-alert--mobile' : ''}`}>
      <div className="inventory-alert__header">
        <h3>⚠️ Alerta de Estoque</h3>
        <p>Produtos com estoque crítico (≤5 unidades)</p>
      </div>
      
      <div className="inventory-alert__content">
        {loading ? (
          <div className="inventory-alert__loading">
            <div className="inventory-alert__spinner"></div>
            <span>Verificando estoque...</span>
          </div>
        ) : error ? (
          <div className="inventory-alert__error">
            <span>❌ {error}</span>
          </div>
        ) : produtos.length === 0 ? (
          <div className="inventory-alert__empty">
            <span>✅ Nenhum produto com estoque baixo</span>
          </div>
        ) : (
          <div className="inventory-alert__list">
            <h4>Produtos que precisam de reposição:</h4>
            <ul>
              {produtos.map(produto => (
                <li key={produto.id} className="inventory-alert__item">
                  <div className="inventory-alert__product-info">
                    <span className="inventory-alert__product-name">{produto.nome}</span>
                    <span className="inventory-alert__product-stock">
                      Estoque: <span className="inventory-alert__stock--critical">{produto.estoque}</span>
                    </span>
                  </div>
                  <div className="inventory-alert__product-actions">
                    <button 
                      className="inventory-alert__action inventory-alert__action--reorder"
                      onClick={() => alert(`Solicitar reposição de ${produto.nome}`)}
                    >
                      📦 Solicitar Reposição
                    </button>
                    <button 
                      className="inventory-alert__action inventory-alert__action--edit"
                      onClick={() => window.location.href = `/produtos#${produto.id}`}
                    >
                      ✏️️ Editar Produto
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryAlert;
