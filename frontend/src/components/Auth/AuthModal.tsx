import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotPasswordForm from './ForgotPasswordForm';
import { LoginRequest, RegisterRequest } from '../../types';

type AuthModalView = 'login' | 'register' | 'forgot-password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: AuthModalView;
}

const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose, 
  defaultView = 'login' 
}) => {
  const { t } = useTranslation();
  const { login, register } = useAuth();
  const [currentView, setCurrentView] = useState<AuthModalView>(defaultView);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Reset to login view whenever the modal is opened
  useEffect(() => {
    if (isOpen) {
      setCurrentView('login');
      setError('');
      setSuccess('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleLogin = async (credentials: LoginRequest) => {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await login(credentials);
      if (result.success) {
        onClose();
        // Success message can be shown via a toast or similar
      } else {
        setError(result.message || t('invalidCredentials'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterRequest) => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const result = await register(data);
      if (result.success) {
        setSuccess(t('registrationSuccess'));
        setError('');
        // Don't close modal, show success message and allow switching to login
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password functionality
    setCurrentView('forgot-password');
  };

  const resetState = () => {
    setError('');
    setSuccess('');
    setIsLoading(false);
  };

  const switchToLogin = () => {
    resetState();
    setCurrentView('login');
  };

  const switchToRegister = () => {
    resetState();
    setCurrentView('register');
  };

  if (!isOpen) return null;

  switch (currentView) {
    case 'login':
      return (
        <LoginForm
          onSubmit={handleLogin}
          onClose={onClose}
          onSwitchToRegister={switchToRegister}
          onForgotPassword={handleForgotPassword}
          isLoading={isLoading}
          error={error}
        />
      );

    case 'register':
      return (
        <RegisterForm
          onSubmit={handleRegister}
          onClose={onClose}
          onSwitchToLogin={switchToLogin}
          isLoading={isLoading}
          error={error}
          success={success}
        />
      );

    case 'forgot-password':
      return (
        <ForgotPasswordForm
          onClose={onClose}
          onBackToLogin={switchToLogin}
        />
      );

    default:
      return null;
  }
};

export default AuthModal;