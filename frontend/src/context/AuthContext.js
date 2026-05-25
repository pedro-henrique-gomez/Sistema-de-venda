import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Estado inicial da autenticação
const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null
};

// Actions para o reducer
const authActions = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING'
};

// Reducer de autenticação
const authReducer = (state, action) => {
  switch (action.type) {
    case authActions.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null
      };
      
    case authActions.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
      
    case authActions.LOGIN_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: action.payload
      };
      
    case authActions.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null
      };
      
    case authActions.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
      
    case authActions.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
      
    default:
      return state;
  }
};

// Criar o Context
const AuthContext = createContext();

// Provider do Context
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Efeito para salvar/recuperar token do localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('authUser');
    
    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({
          type: authActions.LOGIN_SUCCESS,
          payload: { user, token: savedToken }
        });
      } catch (error) {
        console.error('Erro ao recuperar dados do localStorage:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    }
  }, []);

  // Efeito para sincronizar com localStorage
  useEffect(() => {
    if (state.isAuthenticated && state.token) {
      localStorage.setItem('authToken', state.token);
      localStorage.setItem('authUser', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    }
  }, [state.isAuthenticated, state.token, state.user]);

  const value = {
    state,
    dispatch,
    login: async (email, senha) => {
      dispatch({ type: authActions.LOGIN_START });
      
      try {
        const apiUrl = process.env.REACT_APP_API_URL || '/api';
        const response = await fetch(`${apiUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, senha })
        });

        const data = await response.json();

        if (response.ok) {
          dispatch({
            type: authActions.LOGIN_SUCCESS,
            payload: {
              user: data.usuario,
              token: data.token
            }
          });
          
          // Salvar no localStorage
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('authUser', JSON.stringify(data.usuario));
          
          return { success: true, user: data.usuario };
        } else {
          dispatch({
            type: authActions.LOGIN_FAILURE,
            payload: data.error || 'Erro no login'
          });
          return { success: false, error: data.error || 'Erro no login' };
        }
      } catch (error) {
        dispatch({
          type: authActions.LOGIN_FAILURE,
          payload: 'Erro de conexão'
        });
        return { success: false, error: 'Erro de conexão' };
      }
    },
    
    logout: () => {
      dispatch({ type: authActions.LOGOUT });
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    },
    
    clearError: () => {
      dispatch({ type: authActions.CLEAR_ERROR });
    },
    
    setLoading: (loading) => {
      dispatch({ type: authActions.SET_LOADING, payload: loading });
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export default AuthContext;
