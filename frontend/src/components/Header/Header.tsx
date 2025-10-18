import React from 'react';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="app-header">
      <div className="header-content">
        <h1>BM Last Heard</h1>
        <p className="subtitle">Brandmeister Network Activity Monitor</p>
      </div>
    </header>
  );
};

export default Header;
