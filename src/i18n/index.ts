import { getLocales } from 'expo-localization';

import { useApp } from '@/store/app';

import { am } from './am';
import { en, type StringKey } from './en';
import { es } from './es';
import { fr } from './fr';
import { sw } from './sw';

export type Lang = 'en' | 'fr' | 'es' | 'sw' | 'am';

export const LANGUAGES: { code: Lang; label: string; speech: string }[] = [
  { code: 'en', label: 'English', speech: 'en-US' },
  { code: 'fr', label: 'Français', speech: 'fr-FR' },
  { code: 'es', label: 'Español', speech: 'es-MX' },
  { code: 'sw', label: 'Kiswahili', speech: 'sw-KE' },
  { code: 'am', label: 'አማርኛ', speech: 'am-ET' },
];

const TABLES: Record<Lang, Partial<Record<StringKey, string>>> = { en, fr, es, sw, am };

export type Vars = Record<string, string | number>;

export function translate(lang: Lang, key: string, vars?: Vars): string {
  const raw = TABLES[lang]?.[key as StringKey] ?? en[key as StringKey] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}

export function deviceLang(): Lang {
  const code = getLocales()[0]?.languageCode ?? 'en';
  return (LANGUAGES.find((l) => l.code === code)?.code ?? 'en') as Lang;
}

/** Non-hook translator, for voice prompts and other imperative code. */
export function t(key: string, vars?: Vars): string {
  return translate(useApp.getState().lang, key, vars);
}

export function useT(): (key: string, vars?: Vars) => string {
  const lang = useApp((s) => s.lang);
  return (key, vars) => translate(lang, key, vars);
}
