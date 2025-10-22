import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

interface EmailChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
}

const EmailChangeModal: React.FC<EmailChangeModalProps> = ({ isOpen, onClose, currentEmail }) => {
  const { t } = useTranslation();
  const { requestEmailChange } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [step, setStep] = useState<'form' | 'confirmation'>('form');
  
  const [formData, setFormData] = useState({
    newEmail: '',
    currentPassword: ''
  });

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.newEmail.trim()) {
      errors.newEmail = t('required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.newEmail)) {
      errors.newEmail = t('invalidEmail');
    } else if (formData.newEmail.toLowerCase() === currentEmail.toLowerCase()) {
      errors.newEmail = t('newEmailSameAsCurrent', 'New email must be different from current email');
    }

    if (!formData.currentPassword) {
      errors.currentPassword = t('required');
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
      const result = await requestEmailChange(formData.newEmail, formData.currentPassword);
      if (result.success) {
        setStep('confirmation');
        setSuccess(result.message || t('emailChangeRequestSent', 'Email change confirmation sent to your new email address.'));
        setError('');
      } else {
        setError(result.message || t('emailChangeRequestFailed', 'Failed to process email change request.'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('emailChangeRequestFailed', 'Failed to process email change request.'));
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
    // Reset form to initial state
    setFormData({ newEmail: '', currentPassword: '' });
    setFieldErrors({});
    setError('');
    setSuccess('');
    setStep('form');
    onClose();
  };

  const handleClose = () => {
    if (step === 'confirmation') {
      // If user is on confirmation step, just close the modal
      handleCancel();
    } else {
      // If on form step, ask for confirmation
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-overlay" onClick={handleClose}>
      <div className="auth-modal email-change-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={handleClose} aria-label="Close">
          ×
        </button>
        
        <div className="auth-modal-header">
          <h2>{t('changeEmail')}</h2>
          {step === 'form' ? (
            <p>{t('changeEmailPrompt', 'Enter your new email address and current password to request an email change.')}</p>
          ) : (
            <p>{t('emailChangeConfirmationPrompt', 'Please check your new email address for the confirmation link.')}</p>
          )}
        </div>

        {step === 'form' ? (
          <form className="auth-form email-change-form" onSubmit={handleSubmit}>
            {error && (
              <div className="auth-general-error">
                {error}
              </div>
            )}

            <div className="form-group">
              <label>{t('currentEmail', 'Current Email')}</label>
              <div className="readonly-field">
                <span>{currentEmail}</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="newEmail">{t('newEmail')}</label>
              <input
                id="newEmail"
                type="email"
                value={formData.newEmail}
                onChange={(e) => handleInputChange('newEmail', e.target.value)}
                placeholder={t('newEmailPlaceholder', 'Enter your new email address')}
                className={fieldErrors.newEmail ? 'error' : ''}
                disabled={isLoading}
                autoComplete="email"
              />
              {fieldErrors.newEmail && (
                <div className="error-message">{fieldErrors.newEmail}</div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="currentPassword">{t('currentPassword')}</label>
              <input
                id="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                placeholder={t('currentPasswordPlaceholder', 'Enter your current password')}
                className={fieldErrors.currentPassword ? 'error' : ''}
                disabled={isLoading}
                autoComplete="current-password"
              />
              {fieldErrors.currentPassword && (
                <div className="error-message">{fieldErrors.currentPassword}</div>
              )}
            </div>

            <div className="form-group info-note">
              <small>
                {t('emailChangeNote', 'You will receive a confirmation email at your new email address. You must click the link in that email to complete the change.')}
              </small>
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
                {t('changeEmailButton')}
              </button>
            </div>
          </form>
        ) : (
          <div className="auth-form email-change-confirmation">
            {success && (
              <div className="auth-general-success">
                {success}
              </div>
            )}

            <div className="confirmation-content">
              <div className="confirmation-icon">
                ✉️
              </div>
              <h3>{t('checkYourEmail', 'Check Your Email')}</h3>
              <p>
                {t('emailChangeInstructions', {
                  email: formData.newEmail,
                  defaultValue: 'We have sent a confirmation link to {{email}}. Please check your inbox and click the link to complete your email address change.'
                })}
              </p>
              <div className="email-info">
                <strong>{formData.newEmail}</strong>
              </div>
            </div>

            <div className="form-actions confirmation-actions">
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={handleCancel}
              >
                {t('done')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailChangeModal;