import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile as UserProfileType, ProfileUpdateRequest } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import ChangePassword from './ChangePassword';
import './Auth.css';

interface AccountSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfileType;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ isOpen, onClose, user }) => {
  const { t } = useTranslation();
  const { updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  
  const [formData, setFormData] = useState<ProfileUpdateRequest>({
    name: user.name,
    callsign: user.callsign,
    locale: user.locale,
  });

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = t('nameRequired');
    }

    if (!formData.callsign.trim()) {
      errors.callsign = t('callsignRequired');
    } else if (!/^[A-Z0-9]{3,8}$/i.test(formData.callsign.trim())) {
      errors.callsign = t('invalidCallsign');
    }

    if (!formData.locale) {
      errors.locale = t('required');
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
      const result = await updateProfile(formData);
      if (result.success) {
        setSuccess(t('profileUpdated'));
        setError('');
        // Close modal after 2 seconds to show success message
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.message || 'Update failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileUpdateRequest, value: string) => {
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
    // Reset form to original values
    setFormData({
      name: user.name,
      callsign: user.callsign,
      locale: user.locale,
    });
    setFieldErrors({});
    setError('');
    setSuccess('');
    onClose();
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
  ];

  if (!isOpen) return null;

  return (
    <div className="auth-overlay" onClick={handleCancel}>
      <div className="auth-modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={handleCancel} aria-label="Close">
          ×
        </button>
        
        <div className="auth-modal-header">
          <h2>{t('accountSettings')}</h2>
          <p>{t('updateProfile')}</p>
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
              style={{ fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace' }}
            />
            {fieldErrors.callsign && (
              <div className="error-message">{fieldErrors.callsign}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="locale">{t('languagePreference')}</label>
            <select
              id="locale"
              value={formData.locale}
              onChange={(e) => handleInputChange('locale', e.target.value)}
              className={fieldErrors.locale ? 'error' : ''}
              disabled={isLoading}
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            {fieldErrors.locale && (
              <div className="error-message">{fieldErrors.locale}</div>
            )}
          </div>

          <div className="form-group">
            <label>{t('email')}</label>
            <div className="readonly-field">
              <span>{user.email}</span>
              <small className="field-note">
                {t('changeEmail')} {t('optionAvailableSeparately')}
              </small>
            </div>
          </div>

          <div className="form-group">
            <label>{t('password')}</label>
            <div className="readonly-field">
              <span>••••••••</span>
              <button
                type="button"
                className="btn btn-link"
                onClick={() => setShowChangePassword(true)}
                style={{ 
                  padding: '0',
                  fontSize: '14px',
                  textDecoration: 'underline',
                  color: '#007bff'
                }}
              >
                {t('changePassword')}
              </button>
            </div>
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
              {t('saveChanges')}
            </button>
          </div>
        </form>
      </div>

      <ChangePassword
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </div>
  );
};

export default AccountSettings;