import type { ExperienceLevel } from './types';
import type { Locale } from './i18n/core';

export const MEASUREMENT_ID = 'G-QEWTRQ1KN1';
type EventName = 'page_view' | 'quiz_start' | 'quiz_complete' | 'result_legend' | 'share_result' | 'language_change';
export type AnalyticsParams = {
  language: Locale;
  experienceLevel?: ExperienceLevel;
  resultLegendId?: string;
  quizComplete?: boolean;
};
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
let initialized = false;
let lastPage = '';

function initialize() {
  if (process.env.NODE_ENV !== 'production' || typeof window === 'undefined') return false;
  if (initialized) return true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer!.push(arguments); };
  // No persistent Analytics identifier/cookie or advertising storage.
  window.gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied',
  });
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, {
    send_page_view: false,
    page_location: window.location.origin + window.location.pathname,
    page_referrer: '', page_title: 'Find My Legend',
    allow_google_signals: false, allow_ad_personalization_signals: false,
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  script.referrerPolicy = 'no-referrer';
  document.head.appendChild(script);
  initialized = true;
  return true;
}

export function trackEvent(name: EventName, params: AnalyticsParams) {
  try {
    if (!initialize()) return;
    // Explicit allowlist: never forward answers, result URLs, or arbitrary objects.
    window.gtag!('event', name, {
      send_to: MEASUREMENT_ID,
      page_location: window.location.origin + window.location.pathname,
      page_referrer: '', page_title: 'Find My Legend',
      language: params.language,
      ...(params.experienceLevel !== undefined && { experienceLevel: params.experienceLevel }),
      ...(params.resultLegendId !== undefined && { resultLegendId: params.resultLegendId }),
      ...(params.quizComplete !== undefined && { quizComplete: params.quizComplete }),
    });
  } catch { /* Analytics must never interrupt the app. */ }
}

export function trackPage(language: Locale) {
  if (typeof window === 'undefined' || lastPage === window.location.pathname) return;
  lastPage = window.location.pathname;
  trackEvent('page_view', { language });
}

// Memory only, per quiz attempt. No generated user/session IDs or answer keys.
export function createQuizAnalytics() {
  let started = false, completed = false, shared = false;
  const results = new Set<string>();
  return {
    reset() { started = false; completed = false; shared = false; results.clear(); },
    start(params: AnalyticsParams) {
      if (started) return;
      started = true;
      trackEvent('quiz_start', { ...params, quizComplete: false });
    },
    complete(params: AnalyticsParams) {
      if (completed) return;
      completed = true;
      trackEvent('quiz_complete', { ...params, quizComplete: true });
    },
    result(params: AnalyticsParams) {
      if (!params.resultLegendId || results.has(params.resultLegendId)) return;
      results.add(params.resultLegendId);
      trackEvent('result_legend', { ...params, quizComplete: true });
    },
    share(params: AnalyticsParams) {
      if (shared) return;
      shared = true;
      trackEvent('share_result', { ...params, quizComplete: true });
    },
  };
}
