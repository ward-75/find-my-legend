// profile ↔ Legend 적합도.
//   40% 스타일 벡터 유사도 + 30% 도메인 유사도 + 15% 난이도 취향 + 10% 주도/대응 취향 + 5% 안정/고점 취향
// 경험 수준이 낮으면 고난도 전설에 소프트 패널티를 적용하되 추천 후보에서 완전히 제외하지는 않는다.
// 표시값은 확률이 아니라 "추천 점수"다.
import { DOMAIN_KEYS, STYLE_KEYS } from "./types";
import { experienceDifficultyPenalty } from "./experience";
import type { ExperienceLevel, LegendMatch, LegendRecord, MatchBreakdown, StyleVector, UserProfile } from "./types";

export const MATCH_WEIGHTS: MatchBreakdown = { style: 0.4, domain: 0.3, difficulty: 0.15, proactive: 0.1, risk: 0.05 };

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function pearson(a: number[], b: number[]): number {
  const n = a.length;
  const ma = a.reduce((s, x) => s + x, 0) / n;
  const mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma, y = b[i] - mb;
    num += x * y; da += x * x; db += y * y;
  }
  if (da === 0 || db === 0) return 0;
  return num / Math.sqrt(da * db);
}

/** 사용자가 강하게 선호/비선호하는 차원(50에서 먼 값)일수록 비중을 크게 */
export function emphasisWeight(userValue: number): number {
  return 0.4 + (Math.abs(userValue - 50) / 50) * 1.2;
}

function weightedCloseness(u: number[], l: number[]): number {
  let num = 0, den = 0;
  for (let i = 0; i < u.length; i++) {
    const w = emphasisWeight(u[i]);
    num += w * Math.abs(u[i] - l[i]);
    den += w * 100;
  }
  return 1 - num / den;
}

/** 0~1: 절반은 거리 기반, 절반은 모양(상관계수) 기반 */
export function vectorSimilarity(u: number[], l: number[], shapeWeight = 0.5): number {
  const close = weightedCloseness(u, l);
  const shape = (pearson(u, l) + 1) / 2;
  return clamp01((1 - shapeWeight) * close + shapeWeight * shape);
}

export function styleSimilarity(p: UserProfile, l: LegendRecord): number {
  const u = STYLE_KEYS.map((k) => p.styles[k]);
  const v = STYLE_KEYS.map((k) => l.recommendationData.scores[k]);
  return vectorSimilarity(u, v, 0.5);
}

export function domainSimilarity(p: UserProfile, l: LegendRecord): number {
  const u = DOMAIN_KEYS.map((k) => p.domains[k]);
  const v = DOMAIN_KEYS.map((k) => l.recommendationData.domainScores[k]);
  return vectorSimilarity(u, v, 0.6);
}

/** 운영 난도 선호(complexity 0~100) → 선호 난이도 1~5 */
export function preferredDifficulty(p: UserProfile): number {
  return 1 + (p.styles.complexity / 100) * 4;
}

/** 0(대응형) ~ 100(주도형) */
export function proactiveIndex(s: StyleVector): number {
  const pro = (s.aggression + s.tempo) / 2;
  const re = (s.control + s.interaction) / 2;
  return (pro - re + 100) / 2;
}

/** 0(안정 추구) ~ 100(고점 추구) */
export function riskIndex(s: StyleVector): number {
  return (s.riskTaking - s.consistency + 100) / 2;
}

export function matchBreakdown(p: UserProfile, l: LegendRecord): MatchBreakdown {
  const r = l.recommendationData;
  return {
    style: styleSimilarity(p, l),
    domain: domainSimilarity(p, l),
    difficulty: 1 - Math.abs(preferredDifficulty(p) - r.difficulty) / 4,
    proactive: 1 - Math.abs(proactiveIndex(p.styles) - proactiveIndex(r.scores)) / 100,
    risk: 1 - Math.abs(riskIndex(p.styles) - riskIndex(r.scores)) / 100,
  };
}

export function rawScore(b: MatchBreakdown): number {
  return (
    b.style * MATCH_WEIGHTS.style +
    b.domain * MATCH_WEIGHTS.domain +
    b.difficulty * MATCH_WEIGHTS.difficulty +
    b.proactive * MATCH_WEIGHTS.proactive +
    b.risk * MATCH_WEIGHTS.risk
  );
}

// 표시 점수 보정 파라미터 (tests/recommendation.test.ts 의 분포 테스트로 고정)
export const SCORE_CURVE = { absLow: 0.5, absHigh: 0.95, floor: 38, span: 60, absShare: 0.6 };

export function toScore(raw: number, minRaw: number, maxRaw: number): number {
  const { absLow, absHigh, floor, span, absShare } = SCORE_CURVE;
  const abs = clamp01((raw - absLow) / (absHigh - absLow));
  const spread = maxRaw - minRaw;
  const rel = spread > 0.02 ? clamp01((raw - minRaw) / spread) : abs;
  return Math.max(1, Math.min(99, Math.round(floor + span * (absShare * abs + (1 - absShare) * rel))));
}

export interface RankOptions {
  experience?: ExperienceLevel;
}

/** 후보 전체를 추천 순으로 정렬해 반환. 기본값은 난이도 보정 없는 경험자 모드. */
export function rankLegends(p: UserProfile, candidates: LegendRecord[], options: RankOptions = {}): LegendMatch[] {
  const experience = options.experience ?? "experienced";
  const scored = candidates.map((legend) => {
    const breakdown = matchBreakdown(p, legend);
    const baseRaw = rawScore(breakdown);
    const experiencePenalty = experienceDifficultyPenalty(experience, legend.recommendationData.difficulty);
    const raw = clamp01(baseRaw - experiencePenalty);
    return { legend, breakdown, baseRaw, experiencePenalty, raw };
  });
  scored.sort((a, b) => b.raw - a.raw || b.baseRaw - a.baseRaw || a.legend.id.localeCompare(b.legend.id));
  const raws = scored.map((s) => s.raw);
  const minRaw = raws.length ? Math.min(...raws) : 0;
  const maxRaw = raws.length ? Math.max(...raws) : 0;
  return scored.map((s, i) => ({ ...s, rank: i + 1, score: toScore(s.raw, minRaw, maxRaw) }));
}
