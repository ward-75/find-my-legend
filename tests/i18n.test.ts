import { describe, expect, it } from 'vitest';
import { MESSAGES, detectLocale, resolveLocale, lookup, withLanguage } from '../lib/i18n/core';
import { translate } from '../lib/i18n/translate';
import { displayLegendName } from '../lib/i18n/names';
import { BASE_LEGENDS, QUESTIONS } from '../lib/data';
import personas from '../data/personas.json';
import { DOMAIN_META, STYLE_META, DIFFICULTY_LABELS } from '../lib/labels';
import { computeProfile } from '../lib/scoring';
import { matchReasons, cautions, summarySentence, whySentences, compareBlurb } from '../lib/explain';
import { ARCHETYPE_ANSWERS } from './helpers';
const hangul = /[가-힣]/;
function displayCopy(): string[] {
  return [
    ...QUESTIONS.flatMap(q => [q.prompt, q.beginnerPrompt, ...(q.type === 'choice' ? q.options.flatMap(o => [o.label, o.beginnerLabel]) : [q.leftLabel, q.rightLabel, q.beginnerLeftLabel, q.beginnerRightLabel])]),
    ...BASE_LEGENDS.flatMap(l => [l.recommendationData.playstyleSummary, ...l.recommendationData.strengths, ...l.recommendationData.weaknesses, l.recommendationData.reviewNote]),
    ...personas.personas.flatMap(p => [p.name, p.description]),
    ...Object.values(DOMAIN_META).flatMap(v => Object.values(v)),
    ...Object.values(STYLE_META).flatMap(v => Object.values(v)),
    ...Object.values(DIFFICULTY_LABELS),
  ].filter((v): v is string => typeof v === 'string' && hangul.test(v));
}
describe('locale resolution and fallback', () => {
  it('maps browser languages and defaults to Korean on detection failure', () => {
    for (const lang of ['ko', 'ko-KR', 'KO-kr']) expect(detectLocale(lang)).toBe('ko');
    for (const lang of ['zh', 'zh-TW', 'zh-Hans-CN']) expect(detectLocale(lang)).toBe('zh-CN');
    for (const lang of ['en-US', 'ja', 'fr']) expect(detectLocale(lang)).toBe('en');
    expect(detectLocale()).toBe('ko'); expect(detectLocale('')).toBe('ko');
    expect(resolveLocale('zh-CN', 'en', 'ko')).toBe('zh-CN');
    expect(resolveLocale('invalid', 'en', 'ko')).toBe('en');
    expect(resolveLocale(null, null, 'ko-KR')).toBe('ko');
  });
  it('falls back from selected language to English then Korean', () => {
    expect(lookup('x', 'zh-CN', { x: { en: 'English', ko: '한국어' } })).toBe('English');
    expect(lookup('x', 'en', { x: { ko: '한국어' } })).toBe('한국어');
    expect(lookup('x', 'zh-CN', {})).toBe('x');
  });
  it('preserves legacy result payload and path when adding language', () => {
    const url = new URL(withLanguage('https://example.com/find-my-legend/?r=v2.abc&view=test#result', 'zh-CN'));
    expect(url.searchParams.get('r')).toBe('v2.abc'); expect(url.searchParams.get('lang')).toBe('zh-CN');
    expect(url.pathname).toBe('/find-my-legend/'); expect(url.hash).toBe('#result');
  });
  it('uses English for cards without official Chinese localization', () => {
    const legend = structuredClone(BASE_LEGENDS[0]);
    legend.localization = { championKo: '추가된 이름', titleKo: null };
    expect(displayLegendName(legend, 'zh-CN')).toBe(legend.officialData.champion);
    expect(displayLegendName(legend, 'en')).toBe(legend.officialData.champion);
  });
});
for (const locale of ['en', 'zh-CN'] as const) {
  it(`${locale}: all questions, options, Legend explanations and labels are translated`, () => {
    const missing = displayCopy().filter(s => hangul.test(translate(s, locale)));
    expect([...new Set(missing)]).toEqual([]);
  });
  it(`${locale}: every generated recommendation narrative is translated`, () => {
    const missing = new Set<string>();
    for (const answers of Object.values(ARCHETYPE_ANSWERS)) {
      const profile = computeProfile(QUESTIONS, answers);
      for (const legend of BASE_LEGENDS) {
        const copy = [...matchReasons(profile, legend).map(r => r.text), ...cautions(profile, legend, 30), summarySentence(profile, legend), ...whySentences(profile, legend), compareBlurb(legend)];
        for (const source of copy) if (hangul.test(translate(source, locale))) missing.add(source);
      }
    }
    expect([...missing]).toEqual([]);
  });
}
it('catalog has complete entries and no untranslated placeholders in static copy', () => {
  for (const [source, entry] of Object.entries(MESSAGES)) {
    expect(entry.en, source).toBeTruthy(); expect(entry['zh-CN'], source).toBeTruthy();
    expect(entry.ko, source).toBeTruthy();
  }
});
