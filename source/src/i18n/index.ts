import { getLocales } from 'expo-localization';
import en from './locales/en';
import es from './locales/es';
import fr from './locales/fr';

// Type definitions
export type Language = 'en' | 'es' | 'fr';

interface TranslationKeys {
  [key: string]: string | TranslationKeys;
}

// Translation catalog
const translations: Record<Language, TranslationKeys> = {
  en,
  es,
  fr,
};

// Current language state (will be managed by appSettings store)
let currentLanguage: Language = 'en';

/**
 * Detect device language from system locale
 * Falls back to 'en' if not available
 */
export function detectDeviceLanguage(): Language {
  try {
    const locales = getLocales();
    if (locales && locales.length > 0) {
      const deviceLang = locales[0].languageCode?.toLowerCase();
      if (deviceLang === 'es') return 'es';
      if (deviceLang === 'fr') return 'fr';
    }
  } catch (error) {
    console.error('Error detecting device language:', error);
  }
  return 'en';
}

/**
 * Set the current language for all translations
 */
export function setLanguage(lang: Language): void {
  if (translations[lang]) {
    currentLanguage = lang;
  } else {
    console.warn(`Language ${lang} not available, falling back to English`);
    currentLanguage = 'en';
  }
}

/**
 * Get the current language
 */
export function getLanguage(): Language {
  return currentLanguage;
}

/**
 * Initialize language from device locale
 * Called on app startup
 */
export function initializeLanguage(): Language {
  const deviceLang = detectDeviceLanguage();
  setLanguage(deviceLang);
  return deviceLang;
}

/**
 * Translate a key to the current language
 * Supports nested keys like "screens.home.title"
 * Returns the key itself if translation not found (for debugging)
 */
export function t(key: string): string {
  // Split key by dots to navigate nested structure
  const keys = key.split('.');
  let value: any = translations[currentLanguage];

  // Navigate through nested object
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      // If key not found, try English as fallback
      value = translations.en;
      for (const fallbackK of keys) {
        if (value && typeof value === 'object') {
          value = value[fallbackK];
        } else {
          // If still not found, return the key itself (for debugging)
          return key;
        }
      }
      break;
    }
  }

  // If value is a string, return it; otherwise return the key
  return typeof value === 'string' ? value : key;
}

/**
 * Get all available languages
 */
export function getAvailableLanguages(): Language[] {
  return ['en', 'es', 'fr'];
}

/**
 * Get language name in the language itself
 * Useful for displaying in Settings
 */
export function getLanguageName(lang: Language): string {
  const names: Record<Language, string> = {
    en: 'English',
    es: 'Español',
    fr: 'Français',
  };
  return names[lang];
}
