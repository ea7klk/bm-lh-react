import React from 'react';
import { useTranslation } from '../../i18n';
import { Language } from '../../i18n/translations';
import './LanguageSelector.css';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  return (
    <div className="language-selector">
      <label htmlFor="language-select" className="language-label">
        {t('language')}:
      </label>
      <select
        id="language-select"
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="language-select"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;