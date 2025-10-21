import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../i18n';
import { UserProfile } from '../../types';
import { adminService } from '../../services/adminService';
import './Auth.css';

interface UserMenuProps {
  user: UserProfile;
  onLogout: () => void;
  onProfile?: () => void;
  onSettings?: () => void;
  onChangeEmail?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({
  user,
  onLogout,
  onProfile,
  onSettings,
  onChangeEmail
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  const handleProfile = () => {
    setIsOpen(false);
    if (onProfile) onProfile();
  };

  const handleSettings = () => {
    setIsOpen(false);
    if (onSettings) onSettings();
  };

  const handleChangeEmail = () => {
    setIsOpen(false);
    if (onChangeEmail) onChangeEmail();
  };

  const handleAdminPanel = () => {
    setIsOpen(false);
    // Open admin panel in new tab
    window.open('/api/admin', '_blank');
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('userMenu')}
      >
        <span>👤</span>
        <span>{user.callsign}</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="user-menu-dropdown">
          <div className="user-menu-item" style={{ padding: '16px', borderBottom: '1px solid #e9ecef' }}>
            <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{user.callsign}</div>
            <div style={{ fontSize: '12px', color: '#6c757d' }}>{user.name}</div>
          </div>

          {onProfile && (
            <button className="user-menu-item" onClick={handleProfile}>
              <span>👤</span>
              {t('viewProfile')}
            </button>
          )}

          {onChangeEmail && (
            <button className="user-menu-item" onClick={handleChangeEmail}>
              <span>✉️</span>
              {t('changeEmail')}
            </button>
          )}

          {onSettings && (
            <button className="user-menu-item" onClick={handleSettings}>
              <span>⚙️</span>
              {t('accountSettings')}
            </button>
          )}

          {/* Admin Panel Link - Only for EA7KLK */}
          {adminService.isAdmin(user.callsign) && (
            <button className="user-menu-item" onClick={handleAdminPanel}>
              <span>🔐</span>
              Admin Panel
            </button>
          )}

          <hr className="user-menu-divider" />

          <button className="user-menu-item" onClick={handleLogout}>
            <span>🚪</span>
            {t('signOut')}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;