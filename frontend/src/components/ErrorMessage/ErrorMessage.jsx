import React from 'react';
import './ErrorMessage.css';

const ErrorMessage = ({ 
  error, 
  onRetry, 
  showRetry = true,
  className = '' 
}) => {
  if (!error) return null;

  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return '🌐';
      case 'timeout':
        return '⏰';
      case 'permission':
        return '🔒';
      case 'validation':
        return '⚠️';
      case 'server':
        return '🔥';
      default:
        return '❌';
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'network':
        return 'Erro de Conexão';
      case 'timeout':
        return 'Tempo Esgotado';
      case 'permission':
        return 'Acesso Negado';
      case 'validation':
        return 'Dados Inválidos';
      case 'server':
        return 'Erro do Servidor';
      default:
        return 'Erro Inesperado';
    }
  };

  const getRetryText = () => {
    if (error.type === 'network') return 'Tentar Novamente';
    if (error.type === 'timeout') return 'Recarregar Página';
    if (error.type === 'server') return 'Tentar Novamente';
    return 'Tentar Novamente';
  };

  return (
    <div className={`error-message ${className}`}>
      <div className="error-message__icon">
        {getErrorIcon()}
      </div>
      <div className="error-message__content">
        <h3 className="error-message__title">
          {getErrorTitle()}
        </h3>
        <p className="error-message__description">
          {error.message}
        </p>
        {error.details && (
          <div className="error-message__details">
            <strong>Detalhes:</strong>
            <ul>
              {Array.isArray(error.details) 
                ? error.details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))
                : <li>{error.details}</li>
              }
            </ul>
          </div>
        )}
        {showRetry && onRetry && (
          <button 
            className="error-message__retry"
            onClick={onRetry}
          >
            {getRetryText()}
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
