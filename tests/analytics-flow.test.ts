// @vitest-environment jsdom
import { createElement, StrictMode } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import App from '../components/App';
import { QUESTIONS } from '../lib/data';
import { ARCHETYPE_ANSWERS } from './helpers';
vi.mock('../components/DomainRadar', () => ({ DomainRadar: () => null }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllEnvs(); });

it('StrictMode: quiz, result, language and successful sharing fire once; failed copy does not', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  history.replaceState(null, '', '/find-my-legend/?lang=ko');
  localStorage.clear();
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,test');
  const copy = vi.fn().mockRejectedValue(new Error('clipboard denied'));
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: copy } });
  Object.defineProperty(document, 'execCommand', { configurable: true, value: vi.fn(() => false) });
  const events = (name: string) => (window.dataLayer || []).map(v => Array.from(v as ArrayLike<unknown>)).filter(v => v[0] === 'event' && v[1] === name);
  render(createElement(StrictMode, null, createElement(App)));
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  expect(events('page_view')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: '테스트 시작' }));
  fireEvent.click(screen.getByRole('button', { name: '질문 시작하기' }));
  for (const [i, q] of QUESTIONS.entries()) {
    const answer = ARCHETYPE_ANSWERS.control[i];
    fireEvent.click(within(screen.getByRole('radiogroup')).getAllByRole('radio')[q.type === 'choice' ? answer : answer - 1]);
    fireEvent.click(screen.getByRole('button', { name: i === QUESTIONS.length - 1 ? '결과 보기' : '다음 질문' }));
  }
  await act(async () => {});
  expect(events('quiz_start')).toHaveLength(1);
  expect(events('quiz_complete')).toHaveLength(1);
  expect(events('result_legend')).toHaveLength(1);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: '링크 복사' })); });
  expect(events('share_result')).toHaveLength(0);
  copy.mockResolvedValue(undefined);
  for (let i = 0; i < 2; i++) {
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: '링크 복사' })); });
  }
  expect(events('share_result')).toHaveLength(1);
  fireEvent.change(screen.getByRole('combobox', { name: '언어' }), { target: { value: 'en' } });
  await act(async () => {});
  expect(events('language_change')).toHaveLength(1);
  expect(events('result_legend')).toHaveLength(1);
  expect(JSON.stringify(events('share_result'))).not.toContain('?r=');
});
