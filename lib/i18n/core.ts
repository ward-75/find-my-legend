import catalog from './messages.json';

export const LOCALES = ['ko', 'en', 'zh-CN'] as const;
export type Locale = typeof LOCALES[number];
export const LANGUAGE_NAMES: Record<Locale, string> = { ko: '한국어', en: 'English', 'zh-CN': '简体中文' };
export const LANGUAGE_STORAGE_KEY = 'find-my-legend.language.v1';
export type MessageCatalog = Record<string, Partial<Record<Locale, string>>>;
export const MESSAGES: MessageCatalog = catalog;
export function validLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}
export function detectLocale(browserLanguage?: string | null): Locale {
  if (!browserLanguage?.trim()) return 'ko';
  const language = browserLanguage.toLowerCase();
  return /^ko(?:-|$)/.test(language) ? 'ko' : /^zh(?:-|$)/.test(language) ? 'zh-CN' : 'en';
}
export function resolveLocale(urlLanguage: string | null, stored: string | null, browserLanguage?: string): Locale {
  return validLocale(urlLanguage) ? urlLanguage : validLocale(stored) ? stored : detectLocale(browserLanguage);
}
export function lookup(source: string, locale: Locale, messages: MessageCatalog = MESSAGES): string {
  return messages[source]?.[locale] ?? messages[source]?.en ?? messages[source]?.ko ?? source;
}
export function withLanguage(url: string, locale: Locale): string {
  const parsed = new URL(url, 'https://local.invalid');
  parsed.searchParams.set('lang', locale);
  return /^https?:\/\//.test(url) ? parsed.toString() : parsed.pathname + parsed.search + parsed.hash;
}
