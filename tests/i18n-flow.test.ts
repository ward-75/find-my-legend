// @vitest-environment jsdom
import { createElement } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from '../components/App';
import { QUESTIONS } from '../lib/data';
import { LANGUAGE_STORAGE_KEY, type Locale } from '../lib/i18n/core';
import { translate } from '../lib/i18n/translate';
import { ARCHETYPE_ANSWERS } from './helpers';
vi.mock('../components/DomainRadar', () => ({ DomainRadar: () => null }));
const draws: string[] = [];
beforeEach(() => {
  history.replaceState(null, '', '/find-my-legend/'); localStorage.clear(); draws.length = 0;
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const context = { fillText: (s: string) => draws.push(s), fillRect() {}, strokeRect() {}, createRadialGradient: () => ({ addColorStop() {} }) };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,test');
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function choose(locale: Locale) { fireEvent.change(screen.getByRole('combobox', { name: /Language|언어|语言/ }), { target: { value: locale } }); }
function noKorean() {
  const missing: string[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest('option[lang],script,style,textarea')) continue;
    if (/[가-힣]/.test(node.textContent ?? '')) missing.push(node.textContent!);
  }
  for (const el of document.querySelectorAll('[aria-label],[title],[alt],[placeholder]')) {
    for (const attr of ['aria-label','title','alt','placeholder']) {
      const value = el.getAttribute(attr); if (value && /[가-힣]/.test(value)) missing.push(value);
    }
  }
  expect([...new Set(missing)]).toEqual([]);
}
for (const locale of ['en','zh-CN'] as const) {
  it(`${locale}: complete localized flow, comparison and language-aware shared reload`, async () => {
    const t = (s: string) => translate(s, locale);
    history.replaceState(null, '', `/find-my-legend/?lang=${locale}`);
    render(createElement(App)); noKorean();
    fireEvent.click(screen.getByRole('button', { name: t('테스트 시작') })); noKorean();
    fireEvent.click(screen.getByRole('button', { name: t('질문 시작하기') }));
    for (const [i, q] of QUESTIONS.entries()) {
      noKorean();
      const answer = ARCHETYPE_ANSWERS.control[i];
      fireEvent.click(within(screen.getByRole('radiogroup')).getAllByRole('radio')[q.type === 'choice' ? answer : answer - 1]);
      fireEvent.click(screen.getByRole('button', { name: t(i === 13 ? '결과 보기' : '다음 질문') }));
    }
    await act(async () => {}); noKorean();
    expect(draws.some(s => /[가-힣]/.test(s))).toBe(false);
    expect(draws).toContain(t('추천 점수'));
    const url = (screen.getByRole('textbox', { name: t('공유 링크') }) as HTMLInputElement).value;
    expect(new URL(url).searchParams.get('lang')).toBe(locale);
    const payload = new URL(url).searchParams.get('r');
    fireEvent.click(screen.getAllByRole('button', { name: t('왜 나랑 잘 맞지?') })[0]); noKorean();
    fireEvent.click(screen.getAllByRole('button', { name: t('왜 나랑 잘 맞지?') })[0]);
    const result = document.querySelector('#top5')?.parentElement?.parentElement?.textContent;
    fireEvent.click(screen.getAllByRole('button', { name: t('비교에 담기') })[0]);
    fireEvent.click(screen.getByRole('button', { name: t('비교하기') })); noKorean();
    fireEvent.click(within(screen.getByRole('dialog')).getAllByRole('button', { name: t('닫기') })[0]);
    choose('ko');
    const koURL = (screen.getByRole('textbox', { name: '공유 링크' }) as HTMLInputElement).value;
    expect(new URL(koURL).searchParams.get('r')).toBe(payload);
    choose(locale);
    expect(document.querySelector('#top5')?.parentElement?.parentElement?.textContent).toBe(result?.replace(t('비교에 담기'),t('비교에 담김')));
    cleanup(); history.replaceState(null, '', url); localStorage.setItem(LANGUAGE_STORAGE_KEY,'ko');
    render(createElement(App)); await act(async () => {}); noKorean();
    expect(document.documentElement.lang).toBe(locale);
    expect(new URL((screen.getByRole('textbox', { name: t('공유 링크') }) as HTMLInputElement).value).searchParams.get('r')).toBe(payload);
    fireEvent.click(screen.getByRole('button', { name: t('전설 목록') })); noKorean();
  });
}
it('switching during a question preserves answers and progress and persists the choice', () => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY,'ko'); render(createElement(App));
  fireEvent.click(screen.getByRole('button',{name:'테스트 시작'}));
  fireEvent.click(screen.getByRole('button',{name:'질문 시작하기'}));
  fireEvent.click(screen.getAllByRole('radio')[1]); choose('en');
  expect(screen.getAllByRole('radio')[1].getAttribute('aria-checked')).toBe('true');
  expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('1');
  fireEvent.click(screen.getByRole('button',{name:translate('다음 질문','en')}));
  choose('zh-CN');
  expect(screen.getByRole('heading',{level:2}).textContent).toBe(translate(QUESTIONS[1].beginnerPrompt!,'zh-CN'));
  expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('zh-CN');
  cleanup(); history.replaceState(null,'','/find-my-legend/'); render(createElement(App));
  expect(document.documentElement.lang).toBe('zh-CN');
});
it('browser detection works and invalid shared links have localized errors',()=>{
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['zh-TW']); render(createElement(App));
  expect(document.documentElement.lang).toBe('zh-CN'); cleanup();
  history.replaceState(null,'','/find-my-legend/?r=invalid&lang=en'); render(createElement(App));
  expect(screen.getByRole('alert')).toBeTruthy(); noKorean();
});

for (const locale of ['en', 'zh-CN'] as const) {
  it(`${locale}: browse filters, detail, empty state and data UI have no missing copy`, async () => {
    const t = (s: string) => translate(s, locale);
    history.replaceState(null, '', `/find-my-legend/?view=legends&lang=${locale}`);
    render(createElement(App)); noKorean();
    const details = screen.getAllByRole('button').filter(b => b.getAttribute('aria-label')?.includes(locale === 'en' ? 'details' : '详情'));
    for (const button of details) {
      fireEvent.click(button); noKorean();
      fireEvent.click(within(screen.getByRole('dialog')).getAllByRole('button', { name: t('닫기') })[0]);
    }
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'no-such-legend' } }); noKorean();
    cleanup(); history.replaceState(null, '', `/find-my-legend/?view=data&lang=${locale}`);
    render(createElement(App)); noKorean();
  }, 20_000);
}
