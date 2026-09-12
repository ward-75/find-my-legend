// @vitest-environment jsdom
import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import PrivacyPage from '../components/PrivacyPage';
import App from '../components/App';
import { translate } from '../lib/i18n/translate';
afterEach(cleanup);
for (const locale of ['ko','en','zh-CN'] as const) {
  it(`${locale}: privacy content, language and navigation`, () => {
    history.replaceState(null, '', `/privacy/?lang=${locale}`);
    render(createElement(PrivacyPage));
    expect(screen.getByRole('heading', { name: translate('개인정보처리방침', locale) })).toBeTruthy();
    expect(document.documentElement.lang).toBe(locale);
    const text = document.querySelector('main')!.textContent!;
    expect(text).toContain('find-my-legend.language.v1');
    expect(text).toContain('find-my-legend.imported.v1');
    expect(text).toContain('fonts.googleapis.com');
    expect(text).toContain('cmsassets.rgpub.io');
    if(locale !== 'ko') expect(text).not.toMatch(/[가-힣]/);
    expect(screen.getByRole('link', { name: translate('처음으로',locale) }).getAttribute('href')).toBe(`/?lang=${locale}`);
    cleanup(); history.replaceState(null,'',`/?lang=${locale}`); render(createElement(App));
    const footer = document.querySelector('footer')!;
    expect(footer.textContent).toContain(translate('Find My Legend는 Riot Games의 공식 서비스가 아닌 비공식 팬 프로젝트입니다. Riot Games의 승인, 후원 또는 제휴를 의미하지 않습니다. Riot Games, Riftbound 및 관련 상표와 자산의 권리는 각 권리자에게 있습니다.',locale));
    expect(screen.getByRole('link',{name:translate('개인정보처리방침',locale)}).getAttribute('href')?.replace('/privacy/?','/privacy?')).toBe(`/privacy?lang=${locale}`);
  });
}
