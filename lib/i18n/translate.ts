import { lookup, MESSAGES, type Locale } from './core';

// Korean source copy is the stable message key. Only display strings are translated.
// Placeholders keep computed scores, names and dates separate from recommendation data.
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const templates = Object.keys(MESSAGES).filter((key) => /\{\w+\}/.test(key)).map((key) => {
  const names: string[] = [];
  let pattern = '', last = 0;
  for (const match of key.matchAll(/\{(\w+)\}/g)) {
    pattern += escape(key.slice(last, match.index)) + (/^(n|q|score|value)$/.test(match[1]) ? '([-+]?\\d+(?:\\.\\d+)?)' : '(.+?)');
    names.push(match[1]); last = match.index! + match[0].length;
  }
  return { key, names, regex: new RegExp('^' + pattern + escape(key.slice(last)) + '$') };
}).sort((a, b) => b.key.length - a.key.length);
const narratives: { regex: RegExp; key: string; names: string[] }[] = [
  { regex: /^당신은 (.+?)(?:과\(와\)|[과와]) (.+?) 성향이 두드러집니다\. (.+?)(?:은\(는\)|[은는]) (.+?) 쪽이 강한 전설이라 이런 취향과 잘 맞습니다\.$/, key: 'summary', names: ['a', 'b', 'name', 'styles'] },
  { regex: /^당신과 (.+?) 모두 (.+?)(?:과\(와\)|[과와]) (.+?) 점수가 높습니다\.$/, key: 'sharedTwo', names: ['name', 'a', 'b'] },
  { regex: /^당신과 (.+?) 모두 (.+?) 점수가 높습니다\.$/, key: 'sharedOne', names: ['name', 'a'] },
  { regex: /^반면 (.+?)(?:은\(는\)|[은는]) (.+?) 쪽이 (\d+)점 더 높습니다\.$/, key: 'legendHigher', names: ['style', 'name', 'n'] },
  { regex: /^반면 (.+?)(?:은\(는\)|[은는]) 당신이 (\d+)점 더 원합니다\.$/, key: 'userHigher', names: ['style', 'n'] },
  { regex: /^두드러지게 겹치는 강점은 적지만, 전체적인 성향 분포가 (.+?)(?:과\(와\)|[과와]) 비슷합니다\.$/, key: 'similarDistribution', names: ['name'] },
  { regex: /^(.+)(?:과\(와\)|[과와]) (.+?)(?:을\(를\)|[을를]) 원하는 사람에게 맞습니다\.$/, key: 'compareBlurb', names: ['a', 'b'] },
];
function interpolate(key: string, names: string[], values: string[], locale: Locale, depth: number) {
  const args = Object.fromEntries(names.map((name, i) => [name, translate(values[i], locale, depth + 1)]));
  return lookup(key, locale).replace(/\{(\w+)\}/g, (_, name: string) => args[name] ?? `{${name}}`);
}
export function translate(source: string, locale: Locale, depth = 0): string {
  if (locale === 'ko' || !source || depth > 6) return source;
  if (Object.hasOwn(MESSAGES, source)) return lookup(source, locale);
  const trimmed = source.trim();
  if (trimmed !== source) return source.slice(0, source.indexOf(trimmed)) + translate(trimmed, locale, depth + 1) + source.slice(source.indexOf(trimmed) + trimmed.length);
  if (source.endsWith(' 원하는 사람에게 맞습니다.')) {
    for (const a of Object.keys(MESSAGES)) {
      for (const particle of ['과 ', '와 ', '과(와) ']) {
        if (!source.startsWith(a + particle)) continue;
        const b = source.slice(a.length + particle.length).replace(/(?:을\(를\)|[을를]) 원하는 사람에게 맞습니다\.$/, '');
        if (Object.hasOwn(MESSAGES, b)) return interpolate('@compareBlurb', ['a', 'b'], [a, b], locale, depth);
      }
    }
  }
  for (const rule of narratives) {
    const match = source.match(rule.regex);
    if (match) return interpolate('@' + rule.key, rule.names, match.slice(1), locale, depth);
  }
  for (const rule of templates) {
    const match = source.match(rule.regex);
    if (match) return interpolate(rule.key, rule.names, match.slice(1), locale, depth);
  }
  // Labels combined by existing components; preserve punctuation and numeric values.
  for (const separator of [' · ', ', ', ' + ', ': ']) {
    if (source.includes(separator)) return source.split(separator).map((part) => translate(part, locale, depth + 1)).join(separator);
  }
  const score = source.match(/^(.+?) (\d+)$/);
  if (score) return translate(score[1], locale, depth + 1) + ' ' + score[2];
  const numbered = source.match(/^(\d+) (.+)$/);
  if (numbered) return numbered[1] + ' ' + translate(numbered[2], locale, depth + 1);
  return source;
}
