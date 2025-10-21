import React from 'react';
import { useTranslation } from 'react-i18next';
import './Header.css';

const Header: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <header className="app-header">
      <div className="header-content">
        <h1>{t('title')}</h1>
        <p className="subtitle">{t('subtitle')}</p>
      </div>
    </header>
  );
};

export default Header;
