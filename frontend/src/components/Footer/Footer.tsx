import React from 'react';
import { useTranslation } from 'react-i18next';
import './Footer.css';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  
  // Get the footer translations object
  const footer = t('footer', { returnObjects: true }) as {
    providedBy: string;
    contactInfo: string;
    cookieNotice: string;
    sourceCodePrefix: string;
    sourceCodeLink: string;
    sourceCodeSuffix: string;
    contactPrefix: string;
    githubIssues: string;
    contactOr: string;
    telegramGroup: string;
  };

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p className="footer-text">
          {footer.providedBy}{' '}
          <span className="footer-contact">{footer.contactInfo}</span>
        </p>
        <p className="footer-text">
          {footer.cookieNotice}
        </p>
        <p className="footer-text">
          {footer.sourceCodePrefix}{' '}
          <a 
            href="https://github.com/ea7klk/bm-lh-react" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-link"
          >
            {footer.sourceCodeLink}
          </a>{' '}
          {footer.sourceCodeSuffix}
        </p>
        <p className="footer-text">
          {footer.contactPrefix}{' '}
          <a 
            href="https://github.com/ea7klk/bm-lh-react/issues" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-link"
          >
            {footer.githubIssues}
          </a>{' '}
          {footer.contactOr}{' '}
          <a 
            href="https://bminfo.ea7klk.es" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-link"
          >
            {footer.telegramGroup}
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;