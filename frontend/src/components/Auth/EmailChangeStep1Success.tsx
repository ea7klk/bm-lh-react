import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './EmailChangeResult.css';

const EmailChangeStep1Success: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const urlMessage = searchParams.get('message');
    if (urlMessage) {
      setMessage(decodeURIComponent(urlMessage));
    } else {
      setMessage(t('emailChangeStep1Success', 'Email change request confirmed. Please check your new email address for the final verification link.'));
    }
  }, [searchParams, t]);

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="email-change-result-container">
      <div className="email-change-result-card step1-success">
        <div className="result-icon">
          📧
        </div>
        <h1>{t('emailChangeStep1Complete', 'Step 1 Complete')}</h1>
        <p className="result-message">{message}</p>
        <div className="step-indicator">
          <div className="step completed">
            <span className="step-number">1</span>
            <span className="step-label">{t('verifyCurrentEmail', 'Verify Current Email')}</span>
          </div>
          <div className="step-arrow">→</div>
          <div className="step active">
            <span className="step-number">2</span>
            <span className="step-label">{t('verifyNewEmail', 'Verify New Email')}</span>
          </div>
        </div>
        <div className="result-actions">
          <button className="btn btn-primary" onClick={handleGoHome}>
            {t('returnToHome', 'Return to Home')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailChangeStep1Success;