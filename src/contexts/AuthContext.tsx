import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import jwt from 'jsonwebtoken';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simulated JWT secret - In production, this would be on the server
const JWT_SECRET = 'your-jwt-secret-key';

// Simulated user database
const MOCK_USERS = [
  { id: '1', email: 'admin@bia.com', password: 'admin123', name: 'Administrador BIA' },
  { id: '2', email: 'trader@bia.com', password: 'trader123', name: 'Trader BIA' }
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = Cookies.get('auth-token');
    if (storedToken) {
      try {
        const decoded = jwt.verify(storedToken, JWT_SECRET) as any;
        setUser(decoded.user);
        setToken(storedToken);
      } catch (error) {
        console.error('Token inválido:', error);
        Cookies.remove('auth-token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser = MOCK_USERS.find(u => u.email === email && u.password === password);
      
      if (!mockUser) {
        return false;
      }

      const userData = { id: mockUser.id, email: mockUser.email, name: mockUser.name };
      const newToken = jwt.sign({ user: userData }, JWT_SECRET, { expiresIn: '24h' });
      
      setUser(userData);
      setToken(newToken);
      Cookies.set('auth-token', newToken, { expires: 1 }); // 1 day
      
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user already exists
      const existingUser = MOCK_USERS.find(u => u.email === email);
      if (existingUser) {
        return false;
      }

      // In real app, would save to backend
      const newUser = { id: Date.now().toString(), email, name };
      const newToken = jwt.sign({ user: newUser }, JWT_SECRET, { expiresIn: '24h' });
      
      setUser(newUser);
      setToken(newToken);
      Cookies.set('auth-token', newToken, { expires: 1 });
      
      return true;
    } catch (error) {
      console.error('Erro no registro:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    Cookies.remove('auth-token');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};