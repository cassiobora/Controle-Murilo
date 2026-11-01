import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/erp';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  sessionHash: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sessionHash, setSessionHash] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inicializa a sessão ao carregar a aplicação
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('cerebro_token');
      const storedHash = localStorage.getItem('cerebro_session_hash');
      const storedUser = localStorage.getItem('cerebro_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setSessionHash(storedHash);
        setUser(JSON.parse(storedUser));
        try {
          const session = await api.getSession();
          if (session && session.user) {
            setUser(session.user);
            setSessionHash(session.sessionHash);
          }
        } catch (e) {
          console.warn('Sessão offline ou inválida, mantendo cache:', e);
        }
      } else {
        // Auto-login com Admin Master (Murilo) para experiência imediata e fluida
        try {
          const data = await api.login('murilo@controlemurilo.com.br', 'admin123');
          setUser(data.user);
          setToken(data.token);
          setSessionHash(data.sessionHash);
        } catch (err) {
          console.error('Erro no auto-login padrão:', err);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      setToken(data.token);
      setSessionHash(data.sessionHash);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setToken(null);
    setSessionHash(null);
  };

  // Permite alternar rapidamente para testar controle de permissões e RLS
  const switchRole = async (targetRole: UserRole) => {
    if (targetRole === 'ADMIN_MASTER') {
      await login('murilo@controlemurilo.com.br', 'admin123');
    } else {
      await login('operador@controlemurilo.com.br', 'operador123');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        sessionHash,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
