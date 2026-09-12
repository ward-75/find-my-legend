'use client';
import { createContext, useContext, useEffect, useState, cloneElement, isValidElement, type ReactNode, type ReactElement } from 'react';
import { LANGUAGE_NAMES, LANGUAGE_STORAGE_KEY, LOCALES, resolveLocale, validLocale, withLanguage, type Locale } from './core';
import { translate } from './translate';
import { trackEvent } from '../analytics';
const Context = createContext<{ locale: Locale; setLocale: (locale: Locale) => void }>({ locale: 'ko', setLocale: () => {} });
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, updateLocale] = useState<Locale>('ko');
  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(LANGUAGE_STORAGE_KEY); } catch { /* storage unavailable */ }
    let language: string | undefined;
    try { language = navigator.languages?.[0] || navigator.language; } catch { /* detection unavailable */ }
    updateLocale(resolveLocale(new URLSearchParams(location.search).get('lang'), stored, language));
    const restore = () => { const next = new URLSearchParams(location.search).get('lang'); if (validLocale(next)) updateLocale(next); };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = translate('나의 Riftbound 전설 찾기 · Find My Legend', locale);
  }, [locale]);
  const setLocale = (next: Locale) => {
    if (next !== locale) trackEvent('language_change', { language: next });
    updateLocale(next);
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, next); } catch { /* in-memory choice still works */ }
    try { history.replaceState(null, '', withLanguage(location.href, next)); } catch { /* embedded preview */ }
  };
  return <Context.Provider value={{ locale, setLocale }}>{children}</Context.Provider>;
}
export function useLanguage() {
  const context = useContext(Context);
  return { ...context, t: (source: string) => translate(source, context.locale) };
}
export function LanguageSelector() {
  const { locale, setLocale, t } = useLanguage();
  return <select aria-label={t('언어')} value={locale} onChange={(event) => { if (validLocale(event.target.value)) setLocale(event.target.value); }} className="max-w-[120px] rounded-lg border border-rim bg-deeper px-2 py-2 text-sm text-vellum">
    {LOCALES.map((value) => <option key={value} value={value} lang={value}>{LANGUAGE_NAMES[value]}</option>)}
  </select>;
}
/** Translate rendered copy only. Component identity, events, values, IDs and data stay intact. */
export function localizeNodes(node: ReactNode, locale: Locale): ReactNode {
  if (typeof node === 'string') return translate(node, locale);
  if (Array.isArray(node)) {
    // JSX splits interpolated sentences into strings/numbers. Join only adjacent text nodes.
    const joined: ReactNode[] = [];
    for (const child of node) {
      if ((typeof child === 'string' || typeof child === 'number') && typeof joined.at(-1) === 'string') joined[joined.length - 1] = String(joined[joined.length - 1]) + String(child);
      else joined.push(typeof child === 'number' ? String(child) : child);
    }
    return joined.map((child, index) => localizeNodes(isValidElement(child) && child.key === null ? cloneElement(child, { key: `copy-${index}` }) : child, locale));
  }
  if (!isValidElement(node)) return node;
  const element = node as ReactElement<Record<string, unknown>>;
  if (element.type === LanguageSelector) return node;
  const props: Record<string, unknown> = {};
  for (const key of ['aria-label', 'title', 'alt', 'placeholder', 'label']) {
    if (typeof element.props[key] === 'string') props[key] = translate(element.props[key] as string, locale);
  }
  if ('children' in element.props) props.children = localizeNodes(element.props.children as ReactNode, locale);
  return cloneElement(element, props);
}
export function LocaleText({ children }: { children: ReactNode }) {
  const { locale } = useLanguage();
  return localizeNodes(children, locale);
}
