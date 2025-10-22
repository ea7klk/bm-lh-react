import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './EmailChangeResult.css';

const EmailChangeSuccess: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const urlMessage = searchParams.get('message');
    if (urlMessage) {
      setMessage(decodeURIComponent(urlMessage));
    } else {
      setMessage(t('emailChangeSuccess', 'Email address updated successfully.'));
    }
  }, [searchParams, t]);

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="email-change-result-container">
      <div className="email-change-result-card success">
        <div className="result-icon">
          ✅
        </div>
        <h1>{t('emailChangeSuccess', 'Email Change Successful')}</h1>
        <p className="result-message">{message}</p>
        <div className="result-actions">
          <button className="btn btn-primary" onClick={handleGoHome}>
            {t('returnToHome', 'Return to Home')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailChangeSuccess;