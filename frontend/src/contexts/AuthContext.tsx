import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, UserProfile, LoginRequest, RegisterRequest, ProfileUpdateRequest, PasswordChangeRequest } from '../types';
import { authService } from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const login = async (credentials: LoginRequest) => {
    const result = await authService.login(credentials);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const register = async (data: RegisterRequest) => {
    const result = await authService.register(data);
    // Note: User is not automatically logged in after registration
    // They need to verify their email first
    return result;
  };

  const updateProfile = async (data: ProfileUpdateRequest) => {
    const result = await authService.updateProfile(data);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const changePassword = async (data: PasswordChangeRequest) => {
    const result = await authService.changePassword(data);
    return result;
  };

  const requestEmailChange = async (newEmail: string, currentPassword: string) => {
    const result = await authService.requestEmailChange({ newEmail, password: currentPassword });
    return result;
  };

  const isAuthenticated = !!user;

  // Check if user is already logged in on app start
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const profile = await authService.getProfile();
          if (profile) {
            setUser(profile);
          } else {
            // Invalid or expired token
            await authService.logout();
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        await authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const contextValue: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    register,
    updateProfile,
    changePassword,
    requestEmailChange,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};