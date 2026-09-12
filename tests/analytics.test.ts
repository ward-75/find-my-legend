// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', 'production');
  history.replaceState(null, '', '/find-my-legend/?r=PRIVATE_ANSWERS&lang=en#private');
  delete window.dataLayer;
  delete window.gtag;
  document.head.querySelectorAll('script').forEach(s => s.remove());
});
afterEach(() => vi.unstubAllEnvs());
const commands = () => (window.dataLayer || []).map(value => Array.from(value as ArrayLike<unknown>));

it('initializes once, denies identifier storage, strips queries and allowlists event data', async () => {
  const { trackPage, trackEvent } = await import('../lib/analytics');
  trackPage('en'); trackPage('en');
  trackEvent('language_change', { language: 'ko', ...{ email: 'private@example.com', answers: 'SECRET', user_id: 'SECRET' } });
  const calls = commands();
  expect(calls.filter(c => c[0] === 'config')).toHaveLength(1);
  expect(calls.filter(c => c[1] === 'page_view')).toHaveLength(1);
  expect(calls.find(c => c[0] === 'consent')?.[2]).toMatchObject({ analytics_storage: 'denied', ad_storage: 'denied' });
  expect(calls.find(c => c[0] === 'config')?.[2]).toMatchObject({ send_page_view: false, page_referrer: '', allow_google_signals: false });
  expect(JSON.stringify(calls)).not.toMatch(/PRIVATE_ANSWERS|SECRET|private@example|\?r=|#private/);
  expect(document.head.querySelectorAll('script[src*="G-QEWTRQ1KN1"]')).toHaveLength(1);
});

it('deduplicates completion, result and share across rerenders and resets for a retake', async () => {
  const { createQuizAnalytics } = await import('../lib/analytics');
  const quiz = createQuizAnalytics();
  const params = { language: 'en', experienceLevel: 'new', resultLegendId: 'legend-1' } as const;
  for (let i = 0; i < 2; i++) {
    quiz.start(params); quiz.complete(params); quiz.result(params); quiz.share(params);
  }
  for (const name of ['quiz_start', 'quiz_complete', 'result_legend', 'share_result']) {
    expect(commands().filter(c => c[1] === name)).toHaveLength(1);
  }
  quiz.reset(); quiz.start(params); quiz.complete(params); quiz.result(params); quiz.share(params);
  expect(commands().filter(c => c[1] === 'share_result')).toHaveLength(2);
});

it('opening a shared result does not count as completing a quiz', async () => {
  const { createQuizAnalytics } = await import('../lib/analytics');
  const quiz = createQuizAnalytics();
  quiz.result({ language: 'ko', resultLegendId: 'legend-1' });
  expect(commands().filter(c => c[1] === 'quiz_complete')).toHaveLength(0);
  expect(commands().filter(c => c[1] === 'result_legend')).toHaveLength(1);
});

it('does not load GA or send events in development', async () => {
  vi.stubEnv('NODE_ENV', 'development');
  const { trackEvent, trackPage } = await import('../lib/analytics');
  trackPage('ko'); trackEvent('quiz_start', { language: 'ko' });
  expect(commands()).toEqual([]);
  expect(document.head.querySelector('script')).toBeNull();
});
