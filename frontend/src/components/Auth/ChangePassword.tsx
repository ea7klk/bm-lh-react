import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PasswordChangeRequest } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

interface ChangePasswordProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { changePassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  const [formData, setFormData] = useState<PasswordChangeRequest & { confirmPassword: string }>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.currentPassword) {
      errors.currentPassword = t('passwordRequired');
    }

    if (!formData.newPassword) {
      errors.newPassword = t('passwordRequired');
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = t('passwordTooShort');
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = t('passwordRequired');
    } else if (formData.newPassword !== formData.confirmPassword) {
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

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      if (result.success) {
        setSuccess(t('passwordChanged'));
        setError('');
        // Reset form
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setFieldErrors({});
        // Close modal after 2 seconds to show success message
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.message || 'Password change failed');
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('Current password is incorrect')) {
          setError(t('currentPasswordIncorrect'));
        } else {
          setError(err.message);
        }
      } else {
        setError('Password change failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    // Clear success/error messages when user makes changes
    if (success) setSuccess('');
    if (error) setError('');
  };

  const handleCancel = () => {
    // Reset form
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setFieldErrors({});
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="auth-overlay" onClick={handleCancel}>
      <div className="auth-modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={handleCancel} aria-label="Close">
          ×
        </button>
        
        <div className="auth-modal-header">
          <h2>{t('changePassword')}</h2>
          <p>{t('changePasswordPrompt')}</p>
        </div>

        <form className="auth-form settings-form" onSubmit={handleSubmit}>
          {error && (
            <div className="auth-general-error">
              {error}
            </div>
          )}

          {success && (
            <div className="auth-general-success">
              {success}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="currentPassword">{t('currentPassword')}</label>
            <input
              id="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
              placeholder={t('currentPasswordPlaceholder')}
              className={fieldErrors.currentPassword ? 'error' : ''}
              disabled={isLoading}
              autoComplete="current-password"
            />
            {fieldErrors.currentPassword && (
              <div className="error-message">{fieldErrors.currentPassword}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">{t('newPassword')}</label>
            <input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              placeholder={t('newPasswordPlaceholder')}
              className={fieldErrors.newPassword ? 'error' : ''}
              disabled={isLoading}
              autoComplete="new-password"
            />
            {fieldErrors.newPassword && (
              <div className="error-message">{fieldErrors.newPassword}</div>
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

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={isLoading}
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading && <span className="loading-spinner" />}
              {t('changePasswordButton')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;