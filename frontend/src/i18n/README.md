# Translation Structure

This directory contains the internationalization (i18n) files for the BM Last Heard application.

## Structure

```
src/i18n/
├── index.tsx                 # React context provider and translation hook
├── translations.ts           # Main translations object (imports from locales)
└── locales/
    ├── index.ts             # Export file for all locales
    ├── en.ts                # English translations
    ├── es.ts                # Spanish translations
    ├── de.ts                # German translations
    └── fr.ts                # French translations
```

## Usage

The translation system uses React Context and provides a hook for accessing translations:

```tsx
import { useTranslation } from '../i18n';

function MyComponent() {
  const { t, language, setLanguage } = useTranslation();
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('showingTalkgroups', { count: 5 })}</p>
    </div>
  );
}
```

## Adding New Translations

1. Add the new translation key to all language files in `locales/`
2. Use the new key in components with `t('newKey')`
3. For dynamic content, use template variables: `t('keyWithVariable', { variable: value })`

## Supported Languages

- **English (en)** - Default language
- **Spanish (es)** - Español
- **German (de)** - Deutsch  
- **French (fr)** - Français

## Language Persistence

The selected language is automatically saved to localStorage and restored on page reload.