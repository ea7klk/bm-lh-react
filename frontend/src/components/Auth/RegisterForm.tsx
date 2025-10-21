import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RegisterRequest } from '../../types';
import './Auth.css';

interface RegisterFormProps {
  onSubmit: (data: RegisterRequest) => Promise<void>;
  onClose: () => void;
  onSwitchToLogin: () => void;
  isLoading?: boolean;
  error?: string;
  success?: string;
}

const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  onClose,
  onSwitchToLogin,
  isLoading = false,
  error,
  success
}) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<RegisterRequest>({
    callsign: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    locale: i18n.language
  });
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.callsign.trim()) {
      errors.callsign = t('callsignRequired');
    } else if (!/^[A-Z0-9/]{3,10}$/i.test(formData.callsign.trim())) {
      errors.callsign = t('invalidCallsign');
    }

    if (!formData.name.trim()) {
      errors.name = t('nameRequired');
    }

    if (!formData.email.trim()) {
      errors.email = t('emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t('invalidEmail');
    }

    if (!formData.password) {
      errors.password = t('passwordRequired');
    } else if (formData.password.length < 8) {
      errors.password = t('passwordTooShort');
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t('passwordsDoNotMatch');
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
      await onSubmit({ ...formData, locale: i18n.language });
    } catch (error) {
      // Error handling is done by parent component
    }
  };

  const handleInputChange = (field: keyof RegisterRequest, value: string) => {
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
          <h2>{t('register')}</h2>
          <p>Create your ham radio account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-general-error">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-success-message">
              {success}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="callsign">{t('callsign')}</label>
            <input
              id="callsign"
              type="text"
              value={formData.callsign}
              onChange={(e) => handleInputChange('callsign', e.target.value.toUpperCase())}
              placeholder={t('callsignPlaceholder')}
              className={fieldErrors.callsign ? 'error' : ''}
              disabled={isLoading}
              autoComplete="username"
            />
            {fieldErrors.callsign && (
              <div className="error-message">{fieldErrors.callsign}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="name">{t('name')}</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={t('namePlaceholder')}
              className={fieldErrors.name ? 'error' : ''}
              disabled={isLoading}
              autoComplete="name"
            />
            {fieldErrors.name && (
              <div className="error-message">{fieldErrors.name}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">{t('email')}</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder={t('emailPlaceholder')}
              className={fieldErrors.email ? 'error' : ''}
              disabled={isLoading}
              autoComplete="email"
            />
            {fieldErrors.email && (
              <div className="error-message">{fieldErrors.email}</div>
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
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <div className="error-message">{fieldErrors.password}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{t('confirmPassword')}</label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder={t('confirmPasswordPlaceholder')}
              className={fieldErrors.confirmPassword ? 'error' : ''}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {fieldErrors.confirmPassword && (
              <div className="error-message">{fieldErrors.confirmPassword}</div>
            )}
          </div>

          <button
            type="submit"
            className="form-submit"
            disabled={isLoading}
          >
            {isLoading && <span className="loading-spinner" />}
            {t('registerButton')}
          </button>

          <div className="form-links">
            <div className="form-switch">
              Already have an account?
              <button
                type="button"
                className="form-link"
                onClick={onSwitchToLogin}
                disabled={isLoading}
              >
                {t('login')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;