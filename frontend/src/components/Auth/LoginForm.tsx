import React, { useState } from 'react';
import { useTranslation } from '../../i18n';
import { LoginRequest } from '../../types';
import './Auth.css';

interface LoginFormProps {
  onSubmit: (credentials: LoginRequest) => Promise<void>;
  onClose: () => void;
  onSwitchToRegister: () => void;
  onForgotPassword: () => void;
  isLoading?: boolean;
  error?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onSubmit,
  onClose,
  onSwitchToRegister,
  onForgotPassword,
  isLoading = false,
  error
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<LoginRequest>({
    identifier: '',
    password: ''
  });
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.identifier.trim()) {
      errors.identifier = t('required');
    }

    if (!formData.password) {
      errors.password = t('passwordRequired');
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      // Error handling is done by parent component
    }
  };

  const handleInputChange = (field: keyof LoginRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        
        <div className="auth-modal-header">
          <h2>{t('login')}</h2>
          <p>Please sign in to your account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-general-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="identifier">{t('emailOrCallsign')}</label>
            <input
              id="identifier"
              type="text"
              value={formData.identifier}
              onChange={(e) => handleInputChange('identifier', e.target.value)}
              placeholder={t('emailOrCallsignPlaceholder')}
              className={fieldErrors.identifier ? 'error' : ''}
              disabled={isLoading}
              autoComplete="username"
            />
            {fieldErrors.identifier && (
              <div className="error-message">{fieldErrors.identifier}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('password')}</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder={t('passwordPlaceholder')}
              className={fieldErrors.password ? 'error' : ''}
              disabled={isLoading}
              autoComplete="current-password"
            />
            {fieldErrors.password && (
              <div className="error-message">{fieldErrors.password}</div>
            )}
          </div>

          <button
            type="submit"
            className="form-submit"
            disabled={isLoading}
          >
            {isLoading && <span className="loading-spinner" />}
            {t('login')}
          </button>

          <div className="form-links">
            <button
              type="button"
              className="form-link"
              onClick={onForgotPassword}
              disabled={isLoading}
            >
              {t('forgotPassword')}
            </button>
            
            <div className="form-switch">
              Don't have an account?
              <button
                type="button"
                className="form-link"
                onClick={onSwitchToRegister}
                disabled={isLoading}
              >
                {t('register')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;