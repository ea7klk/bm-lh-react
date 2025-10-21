import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/authService';
import './Auth.css';

interface ForgotPasswordFormProps {
  onClose: () => void;
  onBackToLogin: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onClose,
  onBackToLogin
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError(t('emailRequired'));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('invalidEmail'));
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const result = await authService.requestPasswordReset({ email });
      if (result.success) {
        setSuccess(t('passwordResetSent'));
        setError('');
      } else {
        setError(result.message || 'Failed to send reset email');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        
        <div className="auth-modal-header">
          <h2>{t('resetPassword')}</h2>
          <p>{t('resetPasswordPrompt')}</p>
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
            <label htmlFor="email">{t('email')}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
              className={error && !success ? 'error' : ''}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <button
            type="submit"
            className="form-submit"
            disabled={isLoading || !!success}
          >
            {isLoading && <span className="loading-spinner" />}
            {t('resetPasswordButton')}
          </button>

          <div className="form-links">
            <button
              type="button"
              className="form-link"
              onClick={onBackToLogin}
              disabled={isLoading}
            >
              {t('backToLogin')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;