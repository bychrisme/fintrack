import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  currency?: string;
  defaultPaymentMode?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  updateUserLocally: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const userData = await api.auth.me();
        setUser(userData);
      } catch (err) {
        console.log('No active session, redirecting to login...');
        setUser(null);
      }
      setLoading(false);
    };
    bootstrapAuth();
  }, []);

  const login = async (credentials: any) => {
    const res = await api.auth.login(credentials);
    setUser(res.user);
  };

  const register = async (data: any) => {
    const res = await api.auth.register(data);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.error('Error during logout:', err);
    }
    setUser(null);
  };

  const updateUserLocally = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUserLocally }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
