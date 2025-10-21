import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en, es, de, fr } from './locales';

// the translations
const resources = {
  en: { translation: en },
  es: { translation: es },
  de: { translation: de },
  fr: { translation: fr },
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en', // language to use, if not passed will use language detector
    fallbackLng: 'en', // use en if detected lng is not available

    keySeparator: false, // we do not use keys in form messages.welcome

    interpolation: {
      escapeValue: false, // react already does escaping
    },
  });

export default i18n;