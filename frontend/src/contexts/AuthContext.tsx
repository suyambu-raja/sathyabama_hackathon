/**
 * Authentication context provider for React app
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api } from '@/lib/api';
import type { User, LoginForm, RegisterForm, UseAuthReturn } from '@/types';

const AuthContext = createContext<UseAuthReturn | null>(null);

export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is authenticated
  const isAuthenticated = !!user && api.isAuthenticated();

  // Login function
  const login = useCallback(async (credentials: LoginForm) => {
    try {
      setIsLoading(true);
      const response = await api.login(credentials);

      // Get user data
      const userData = await api.getCurrentUser();
      setUser(userData);

      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Register function
  const register = useCallback(async (userData: RegisterForm) => {
    try {
      setIsLoading(true);
      const response = await api.register(userData);

      // Get user data
      const user = await api.getCurrentUser();
      setUser(user);

      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Logout function
  const logout = useCallback(() => {
    api.logout();
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/');
  }, [navigate]);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      if (api.isAuthenticated()) {
        const userData = await api.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      // Token might be invalid
      logout();
    }
  }, [logout]);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (api.isAuthenticated()) {
          await refreshUser();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [refreshUser]);

  const value: UseAuthReturn = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };