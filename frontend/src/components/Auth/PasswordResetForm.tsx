import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/authService';
import './Auth.css';

interface PasswordResetFormProps {
  token: string;
  onClose: () => void;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ token, onClose }) => {
  const { t } = useTranslation();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Check if token is valid on component mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setError(t('invalidToken'));
      return;
    }

    // Token validation is implicit - we'll find out when we try to reset
    setTokenValid(true);
  }, [token, t]);

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!password) {
      errors.password = t('passwordRequired');
    } else if (password.length < 8) {
      errors.password = t('passwordTooShort');
    }

    if (!confirmPassword) {
      errors.confirmPassword = t('required');
    } else if (password !== confirmPassword) {
      errors.confirmPassword = t('passwordsDoNotMatch');
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !token) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await authService.confirmPasswordReset({
        token,
        newPassword: password,
        confirmPassword: confirmPassword
      });

      if (result.success) {
        setSuccess(t('passwordResetSuccess'));
        setError('');
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        setError(result.message || t('passwordResetConfirmFailed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('passwordResetConfirmFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: 'password' | 'confirmPassword', value: string) => {
    if (field === 'password') {
      setPassword(value);
    } else {
      setConfirmPassword(value);
    }
    
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Clear success/error messages when user makes changes
    if (success) setSuccess('');
    if (error) setError('');
  };

  if (tokenValid === false) {
    return (
      <div className="auth-overlay" onClick={onClose}>
        <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
          <button className="auth-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
          
          <div className="auth-modal-header">
            <h2>{t('passwordResetError')}</h2>
            <p>{t('invalidTokenMessage')}</p>
          </div>
          
          <div className="auth-form">
            <div className="auth-general-error">
              {error}
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={onClose}
              >
                {t('backToLogin')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <div className="auth-modal-header">
          <h2>{t('resetPassword')}</h2>
          <p>{t('passwordResetConfirmPrompt')}</p>
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
              <p className="redirect-message">{t('redirectingToLogin')}</p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">{t('newPassword')}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder={t('passwordPlaceholder')}
              className={fieldErrors.password ? 'error' : ''}
              disabled={isLoading || !!success}
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
              value={confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder={t('confirmPasswordPlaceholder')}
              className={fieldErrors.confirmPassword ? 'error' : ''}
              disabled={isLoading || !!success}
              autoComplete="new-password"
            />
            {fieldErrors.confirmPassword && (
              <div className="error-message">{fieldErrors.confirmPassword}</div>
            )}
          </div>

          <div className="form-group info-note">
            <small>
              {t('passwordRequirements')}
            </small>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !!success}
            >
              {isLoading && <span className="loading-spinner" />}
              {t('confirmPasswordReset')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordResetForm;