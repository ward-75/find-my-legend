import type { LegendRecord } from '../types';
import type { Locale } from './core';
/** Only use existing official localized names. Never invent or machine-translate card names. */
export function displayLegendName(legend: LegendRecord, locale: Locale): string {
  return locale === 'ko' ? legend.localization?.championKo || legend.officialData.champion : legend.officialData.champion;
}
