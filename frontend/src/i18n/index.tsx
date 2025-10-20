import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKey } from './translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: { [key: string]: string | number }) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && savedLanguage in translations) {
      setLanguage(savedLanguage);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: TranslationKey, params?: { [key: string]: string | number }): string => {
    const currentTranslations = translations[language] as Record<string, string>;
    const fallbackTranslations = translations.en as Record<string, string>;
    
    let translation = currentTranslations[key] || fallbackTranslations[key] || key;

    if (params) {
      Object.keys(params).forEach(param => {
        const value = params[param];
        translation = translation.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      });
    }

    return translation;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};