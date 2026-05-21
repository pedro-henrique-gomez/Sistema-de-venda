import React from 'react';
import './ProductCard.css';

const ProductCard = ({ 
  produto, 
  onEdit, 
  onDelete, 
  onAddStock, 
  isMobile = false,
  showActions = true 
}) => {
  const getEstoqueColor = (estoque) => {
    if (estoque <= 3) return '#dc3545';
    if (estoque <= 10) return '#ffc107';
    return '#28a745';
  };

  const getTipoBadge = (tipo) => {
    const color = tipo === 'Consignado' ? '#fd7e14' : '#28a745';
    return (
      <span 
        className="product-card__badge"
        style={{ backgroundColor: color }}
      >
        {tipo}
      </span>
    );
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className={`product-card ${isMobile ? 'product-card--mobile' : ''}`}>
      <div className="product-card__header">
        <h3 className="product-card__name">{produto.nome}</h3>
        {produto.descricao && (
          <p className="product-card__description">{produto.descricao}</p>
        )}
      </div>
      
      <div className="product-card__body">
        <div className="product-card__info">
          <div className="product-card__row">
            <span className="product-card__label">Código:</span>
            <span className="product-card__value">{produto.codigo || '-'}</span>
          </div>
          
          <div className="product-card__row">
            <span className="product-card__label">Categoria:</span>
            <span className="product-card__value">{produto.categoria || '-'}</span>
          </div>
          
          <div className="product-card__row">
            <span className="product-card__label">Tipo:</span>
            <span className="product-card__value">{getTipoBadge(produto.tipo)}</span>
          </div>
        </div>
        
        <div className="product-card__pricing">
          <div className="product-card__row">
            <span className="product-card__label">Venda:</span>
            <span className="product-card__value product-card__price--sell">
              {formatPrice(produto.precoVenda || produto.preco)}
            </span>
          </div>
          
          <div className="product-card__row">
            <span className="product-card__label">Custo:</span>
            <span className="product-card__value product-card__price--cost">
              {formatPrice(produto.precoCusto || produto.preco)}
            </span>
          </div>
        </div>
        
        <div className="product-card__stock">
          <div className="product-card__row">
            <span className="product-card__label">Estoque:</span>
            <span 
              className="product-card__stock-badge"
              style={{ backgroundColor: getEstoqueColor(produto.estoque) }}
            >
              {produto.estoque}
            </span>
          </div>
          
          <div className="product-card__row">
            <span className="product-card__label">Fornecedor:</span>
            <span className="product-card__value">
              {produto.fornecedor?.nome || '-'}
            </span>
          </div>
        </div>
      </div>
      
      {showActions && (
        <div className="product-card__actions">
          <button 
            className="product-card__action product-card__action--edit"
            onClick={() => onEdit(produto)}
            title="Editar produto"
          >
            ✏️️ Editar
          </button>
          
          <button 
            className="product-card__action product-card__action--stock"
            onClick={() => onAddStock(produto)}
            title="Adicionar estoque"
          >
            📦 Adicionar Estoque
          </button>
          
          <button 
            className="product-card__action product-card__action--delete"
            onClick={() => onDelete(produto)}
            title="Excluir produto"
          >
            🗑️ Excluir
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
