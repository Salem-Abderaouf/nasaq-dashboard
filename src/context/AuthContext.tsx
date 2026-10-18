import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthenticatedUser } from '../types/auth';
import { WorkerPermissions } from '../types/database';
import { AuthService } from '../services/authService';

interface AuthContextType {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  quickLogin: (roleType: 'admin' | 'workshop' | 'commercial') => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (key: keyof WorkerPermissions) => boolean;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(() => AuthService.getCurrentUser());

  const refreshUser = () => {
    const active = AuthService.getCurrentUser();
    setUser(active);
  };

  useEffect(() => {
    // Initial check
    refreshUser();

    // Listen to local storage changes in other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'nasaq_auth_active_user') {
        refreshUser();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const res = await AuthService.login(identifier, password);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Échec de connexion.' };
  };

  const quickLogin = async (roleType: 'admin' | 'workshop' | 'commercial') => {
    const newUser = await AuthService.quickLogin(roleType);
    setUser(newUser);
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  const hasPermission = (key: keyof WorkerPermissions): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return !!user.permissions[key];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        quickLogin,
        logout,
        hasPermission,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
