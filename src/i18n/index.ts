import { NativeModules, Platform } from 'react-native';
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
    // Get device language using React Native's NativeModules
    let deviceLang = 'en';
    if (Platform.OS === 'ios') {
      deviceLang = (
        NativeModules.SettingsManager?.settings?.AppleLocale ||
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ||
        'en'
      ).toLowerCase();
    } else {
      deviceLang = (NativeModules.I18nManager?.localeIdentifier || 'en').toLowerCase();
    }

    // Check for language match
    if (deviceLang.startsWith('es')) return 'es';
    if (deviceLang.startsWith('fr')) return 'fr';
  } catch (error) {
    // Silently fall back to English
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
  // Helper function to get nested value
  const getNestedValue = (obj: any, keys: string[]): string | undefined => {
    let value = obj;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }
    return typeof value === 'string' ? value : undefined;
  };

  const keys = key.split('.');

  // Try current language first
  let result = getNestedValue(translations[currentLanguage], keys);

  // Fall back to English if not found
  if (result === undefined) {
    result = getNestedValue(translations.en, keys);
  }

  // Return key itself if still not found (for debugging)
  return result ?? key;
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
