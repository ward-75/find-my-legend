// 카드풀 cutoff: "X까지"는 order ≤ X인 모든 출시 세트, "X만"은 order = X인 세트.
// releaseDate가 있으면 브라우저의 오늘 날짜와 비교해 자동 활성화한다.
import type { CardSet, LegendRecord, PoolOptions } from "./types";

export const LATEST = "latest";

function localIsoDate(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** releaseDate가 있으면 날짜가 정본. releaseDate가 없을 때만 legacy released 값을 사용한다. */
export function isSetReleased(set: CardSet, now = new Date()): boolean {
  if (set.releaseDate && /^\d{4}-\d{2}-\d{2}$/.test(set.releaseDate)) return set.releaseDate <= localIsoDate(now);
  return set.released;
}

/** 현재 추천 수치가 준비된 전설. 필드가 없는 기존 데이터는 준비된 것으로 본다. */
export function isLegendRecommendationReady(legend: LegendRecord): boolean {
  return legend.recommendationData.recommendationReady !== false;
}

/** 출시된 메인 세트(보조 세트 제외)를 order 순으로 */
export function releasedMainSets(sets: CardSet[], now = new Date()): CardSet[] {
  return sets.filter((s) => isSetReleased(s, now) && !s.isSupplemental).sort((a, b) => a.order - b.order);
}

/** "latest"는 출시된 메인 세트 중 order가 가장 높은 세트로 해석한다. */
export function resolveCutoff(sets: CardSet[], cutoff: string, now = new Date()): CardSet | null {
  const main = releasedMainSets(sets, now);
  if (cutoff === LATEST) return main[main.length - 1] ?? null;
  const found = sets.find((s) => s.id === cutoff);
  if (!found || !isSetReleased(found, now)) return null;
  return found;
}

export function isSetInPool(set: CardSet, cutoffSet: CardSet, opts: PoolOptions, now = new Date()): boolean {
  if (!isSetReleased(set, now)) return false;
  if (set.isSupplemental && !opts.includeSupplemental) return false;
  return opts.mode === "only" ? set.order === cutoffSet.order : set.order <= cutoffSet.order;
}

export function poolSets(sets: CardSet[], opts: PoolOptions, now = new Date()): CardSet[] {
  const cutoffSet = resolveCutoff(sets, opts.cutoff, now);
  if (!cutoffSet) return [];
  return sets.filter((s) => isSetInPool(s, cutoffSet, opts, now));
}

export function filterLegendsByPool(legends: LegendRecord[], sets: CardSet[], opts: PoolOptions, now = new Date()): LegendRecord[] {
  const ids = new Set(poolSets(sets, opts, now).map((s) => s.id));
  return legends.filter((l) => ids.has(l.officialData.setId));
}

export function filterRecommendationCandidates(legends: LegendRecord[], sets: CardSet[], opts: PoolOptions, now = new Date()): LegendRecord[] {
  return filterLegendsByPool(legends, sets, opts, now).filter(isLegendRecommendationReady);
}

export const DEFAULT_POOL: PoolOptions = { cutoff: LATEST, mode: "cumulative", includeSupplemental: true };
