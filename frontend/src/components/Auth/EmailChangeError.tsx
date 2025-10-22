import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './EmailChangeResult.css';

const EmailChangeError: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const urlMessage = searchParams.get('message');
    if (urlMessage) {
      setMessage(decodeURIComponent(urlMessage));
    } else {
      setMessage(t('emailChangeError', 'There was an error processing your email change request.'));
    }
  }, [searchParams, t]);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleTryAgain = () => {
    navigate('/');
    // The user can try the email change process again from the user menu
  };

  return (
    <div className="email-change-result-container">
      <div className="email-change-result-card error">
        <div className="result-icon">
          ❌
        </div>
        <h1>{t('emailChangeError', 'Email Change Error')}</h1>
        <p className="result-message">{message}</p>
        <div className="result-actions">
          <button className="btn btn-primary" onClick={handleTryAgain}>
            {t('tryAgain', 'Try Again')}
          </button>
          <button className="btn btn-secondary" onClick={handleGoHome}>
            {t('returnToHome', 'Return to Home')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailChangeError;