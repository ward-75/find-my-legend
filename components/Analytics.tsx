'use client';
import { useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/react';
import { trackPage } from '@/lib/analytics';

export function Analytics() {
  const { locale } = useLanguage();
  useEffect(() => {
    // Allow language restoration to settle; cleanup also handles Strict Mode.
    const timer = setTimeout(() => trackPage(locale), 0);
    return () => clearTimeout(timer);
  }, [locale]);
  return null;
}
