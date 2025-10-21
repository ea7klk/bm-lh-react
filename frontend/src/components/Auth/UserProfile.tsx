import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserProfile as UserProfileType } from '../../types';
import './Auth.css';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfileType;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose, user }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatDateTime = (timestamp?: number) => {
    if (!timestamp) return t('never');
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>
        
        <div className="auth-modal-header">
          <h2>{t('profile')}</h2>
          <p>{t('personalInformation')}</p>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <h3>{t('basicInformation')}</h3>
            
            <div className="profile-field-group">
              <div className="profile-field">
                <label>{t('callsign')}:</label>
                <div className="profile-value callsign-value">{user.callsign}</div>
              </div>

              <div className="profile-field">
                <label>{t('name')}:</label>
                <div className="profile-value">{user.name}</div>
              </div>

              <div className="profile-field">
                <label>{t('email')}:</label>
                <div className="profile-value">{user.email}</div>
              </div>

              <div className="profile-field">
                <label>{t('language')}:</label>
                <div className="profile-value">{user.locale.toUpperCase()}</div>
              </div>
            </div>
          </div>

          <div className="profile-section">
            <h3>{t('accountInformation')}</h3>
            
            <div className="profile-field-group">
              <div className="profile-field">
                <label>{t('status')}:</label>
                <div className={`profile-value status-value ${user.is_active ? 'active' : 'inactive'}`}>
                  {user.is_active ? t('active') : t('inactive')}
                </div>
              </div>

              <div className="profile-field">
                <label>{t('memberSince')}:</label>
                <div className="profile-value">{formatDate(user.created_at)}</div>
              </div>

              <div className="profile-field">
                <label>{t('lastLogin')}:</label>
                <div className="profile-value">{formatDateTime(user.last_login_at)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button 
            className="btn btn-secondary"
            onClick={onClose}
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;