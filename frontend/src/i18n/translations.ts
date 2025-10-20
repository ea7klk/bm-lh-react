import { en, es, de, fr } from './locales';

export const translations = {
  en,
  es,
  de,
  fr
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;