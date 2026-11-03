import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '@shared/types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  updatePreferences: (prefs: Partial<IUser['preferences']>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IUser | null>(() => {
    const saved = localStorage.getItem('urbanflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('urbanflow_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyUser() {
      if (token) {
        try {
          const freshUser = await authApi.getMe();
          setUser(freshUser);
          localStorage.setItem('urbanflow_user', JSON.stringify(freshUser));
        } catch {
          // Token invalid
          setUser(null);
          setToken(null);
          localStorage.removeItem('urbanflow_token');
          localStorage.removeItem('urbanflow_user');
        }
      }
      setIsLoading(false);
    }
    verifyUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('urbanflow_token', res.token);
    localStorage.setItem('urbanflow_user', JSON.stringify(res.user));
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    const res = await authApi.register({ name, email, password, role });
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('urbanflow_token', res.token);
    localStorage.setItem('urbanflow_user', JSON.stringify(res.user));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('urbanflow_token');
    localStorage.removeItem('urbanflow_user');
  };

  const updatePreferences = async (prefs: Partial<IUser['preferences']>) => {
    const updated = await authApi.updatePreferences(prefs);
    if (user) {
      const updatedUser = { ...user, preferences: updated };
      setUser(updatedUser);
      localStorage.setItem('urbanflow_user', JSON.stringify(updatedUser));
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        login,
        register,
        logout,
        updatePreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
