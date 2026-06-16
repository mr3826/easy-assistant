import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Locale, translations } from './translations';

const STORAGE_KEY = 'easy-assistant-locale';

interface TranslationVars {
  [key: string]: string | number;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (path: string, vars?: TranslationVars) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getNestedValue(locale: Locale, path: string) {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, translations[locale] as unknown);
}

function formatTemplate(value: string, vars?: TranslationVars) {
  if (!vars) {
    return value;
  }

  return value.replace(/\{(\w+)\}/g, (_, key: string) => {
    const next = vars[key];
    return next === undefined || next === null ? '' : String(next);
  });
}

function readInitialLocale(): Locale {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'bn' ? 'bn' : 'en';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readInitialLocale());

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const t = (path: string, vars?: TranslationVars) => {
      const localized = getNestedValue(locale, path);
      const fallback = getNestedValue('en', path);
      const resolved = typeof localized === 'string' ? localized : typeof fallback === 'string' ? fallback : path;
      return formatTemplate(resolved, vars);
    };

    return {
      locale,
      setLocale: (nextLocale: Locale) => setLocaleState(nextLocale),
      toggleLocale: () => setLocaleState((current) => (current === 'en' ? 'bn' : 'en')),
      t,
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }

  return context;
}

