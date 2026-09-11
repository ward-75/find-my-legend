// 추천 설명은 전부 "태그 문구 + 실제 점수 차이"로 조립한다. 생성형 문장은 쓰지 않는다.
import { DOMAIN_KEYS, STYLE_KEYS } from "./types";
import type { DomainKey, LegendRecord, StyleKey, UserProfile } from "./types";
import { DOMAIN_META, STYLE_META, DIFFICULTY_LABELS } from "./labels";
import { championKo } from "./data";
import { josa } from "./josa";
import { preferredDifficulty } from "./recommendation";

export interface StyleRow {
  key: StyleKey;
  label: string;
  user: number;
  legend: number;
}

export const HIGH = 60;
export const GAP = 28;

export function topStyles(p: UserProfile, n = 6): { key: StyleKey; value: number }[] {
  return STYLE_KEYS.map((key) => ({ key, value: p.styles[key] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

export function topDomains(p: UserProfile, n = 2): { key: DomainKey; value: number }[] {
  return DOMAIN_KEYS.map((key) => ({ key, value: p.domains[key] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

export function legendTopStyles(l: LegendRecord, n = 3): StyleKey[] {
  const s = l.recommendationData.scores;
  return STYLE_KEYS.slice().sort((a, b) => s[b] - s[a]).slice(0, n);
}

/** 둘 다 높은 차원 = "잘 맞는 이유" */
export function sharedStrengths(p: UserProfile, l: LegendRecord, n = 5): StyleRow[] {
  const s = l.recommendationData.scores;
  return STYLE_KEYS.filter((k) => p.styles[k] >= HIGH && s[k] >= HIGH)
    .map((k) => ({ key: k, label: STYLE_META[k].label, user: p.styles[k], legend: s[k] }))
    .sort((a, b) => Math.min(b.user, b.legend) - Math.min(a.user, a.legend))
    .slice(0, n);
}

export interface Reason {
  text: string;
}

export function matchReasons(p: UserProfile, l: LegendRecord): Reason[] {
  const reasons: Reason[] = sharedStrengths(p, l, 4).map((r) => ({ text: STYLE_META[r.key].trait }));
  const userTop = topDomains(p, 2).map((d) => d.key);
  const shared = l.officialData.domains.filter((d) => userTop.includes(d));
  if (shared.length) {
    reasons.unshift({ text: `${shared.map((d) => DOMAIN_META[d].label).join(" + ")} 도메인 성향 일치` });
  }
  const pref = preferredDifficulty(p);
  if (Math.abs(pref - l.recommendationData.difficulty) <= 0.75) {
    reasons.push({ text: `선호하는 운영 난도와 비슷함 (${DIFFICULTY_LABELS[l.recommendationData.difficulty]})` });
  }
  if (reasons.length === 0) {
    // 공통 강점이 없으면 상대적으로 가장 가까운 두 차원을 보여준다
    const closest = STYLE_KEYS.slice()
      .sort((a, b) => Math.abs(p.styles[a] - l.recommendationData.scores[a]) - Math.abs(p.styles[b] - l.recommendationData.scores[b]))
      .slice(0, 2);
    closest.forEach((k) => reasons.push({ text: `${STYLE_META[k].label} 성향이 비슷함` }));
  }
  return reasons.slice(0, 5);
}

/** 주의할 점 후보를 우선순위대로: 크게 어긋나는 차원 → 난이도 차이 → 전설 고유 약점(데이터) */
export function cautionCandidates(p: UserProfile, l: LegendRecord): string[] {
  const s = l.recommendationData.scores;
  const gaps = STYLE_KEYS.map((k) => ({ k, d: s[k] - p.styles[k] }))
    .filter(({ k, d }) => Math.abs(d) >= GAP && Math.max(s[k], p.styles[k]) >= HIGH)
    .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
    .map(({ k, d }) => (d > 0 ? STYLE_META[k].legendHigher : STYLE_META[k].userHigher));
  const out = [...gaps];
  if (l.recommendationData.difficulty - preferredDifficulty(p) >= 1.5 && !out.some((t) => t.includes("난도"))) {
    out.push("운영 난도가 당신의 선호보다 높은 편");
  }
  out.push(...l.recommendationData.weaknesses);
  return [...new Set(out)];
}

/** avoid에 든 문구(이미 다른 카드에 보여 준 것)는 가능하면 건너뛴다 */
export function cautions(p: UserProfile, l: LegendRecord, n = 2, avoid?: Set<string>): string[] {
  const all = cautionCandidates(p, l);
  const fresh = all.filter((t) => !avoid?.has(t));
  return (fresh.length ? fresh : all).slice(0, n);
}

/** TOP N 카드에 같은 주의 문구가 반복되지 않도록 순위 순서대로 배정 */
export function assignCautions(p: UserProfile, legends: LegendRecord[], perCard: (rank: number) => number = (r) => (r === 1 ? 3 : 2)): Record<string, string[]> {
  const shown = new Set<string>();
  const out: Record<string, string[]> = {};
  legends.forEach((l, i) => {
    const list = cautions(p, l, perCard(i + 1), shown);
    list.forEach((t) => shown.add(t));
    out[l.id] = list;
  });
  return out;
}

export function summarySentence(p: UserProfile, l: LegendRecord): string {
  const mine = topStyles(p, 2).map((t) => STYLE_META[t.key].label);
  const shared = sharedStrengths(p, l, 3).map((r) => r.label);
  const theirs = shared.length >= 2 ? shared : legendTopStyles(l, 3).map((k) => STYLE_META[k].label);
  const name = championKo(l);
  return `당신은 ${josa(mine[0], "과/와")} ${mine[1]} 성향이 두드러집니다. ${josa(name, "은/는")} ${theirs.join(", ")} 쪽이 강한 전설이라 이런 취향과 잘 맞습니다.`;
}

// ── "왜 나랑 잘 맞지?" ────────────────────────────────────────
export function whyRows(p: UserProfile, l: LegendRecord, n = 7): StyleRow[] {
  const s = l.recommendationData.scores;
  const keys = new Set<StyleKey>([
    ...topStyles(p, 4).map((t) => t.key),
    ...legendTopStyles(l, 3),
  ]);
  // 가장 크게 어긋나는 차원 하나는 비교를 위해 포함
  const worst = STYLE_KEYS.slice().sort((a, b) => Math.abs(s[b] - p.styles[b]) - Math.abs(s[a] - p.styles[a]))[0];
  keys.add(worst);
  return [...keys].slice(0, n + 1).map((k) => ({ key: k, label: STYLE_META[k].label, user: p.styles[k], legend: s[k] }));
}

export function whySentences(p: UserProfile, l: LegendRecord): string[] {
  const name = championKo(l);
  const shared = sharedStrengths(p, l, 2);
  const out: string[] = [];
  if (shared.length >= 2) {
    out.push(`당신과 ${name} 모두 ${josa(shared[0].label, "과/와")} ${shared[1].label} 점수가 높습니다.`);
  } else if (shared.length === 1) {
    out.push(`당신과 ${name} 모두 ${shared[0].label} 점수가 높습니다.`);
  }
  const s = l.recommendationData.scores;
  const gap = STYLE_KEYS.map((k) => ({ k, d: s[k] - p.styles[k] })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0];
  if (gap && Math.abs(gap.d) >= GAP) {
    const label = STYLE_META[gap.k].label;
    out.push(
      gap.d > 0
        ? `반면 ${josa(label, "은/는")} ${name} 쪽이 ${Math.round(gap.d)}점 더 높습니다.`
        : `반면 ${josa(label, "은/는")} 당신이 ${Math.round(-gap.d)}점 더 원합니다.`,
    );
  }
  if (out.length === 0) out.push(`두드러지게 겹치는 강점은 적지만, 전체적인 성향 분포가 ${josa(name, "과/와")} 비슷합니다.`);
  return out;
}

// ── 비교 ──────────────────────────────────────────────────────
export const COMPARE_KEYS: StyleKey[] = ["aggression", "control", "tempo", "combo", "combat", "cardDraw", "consistency", "complexity"];

export function compareKeys(p: UserProfile | null): StyleKey[] {
  if (!p) return COMPARE_KEYS;
  const extra = topStyles(p, 3).map((t) => t.key).filter((k) => !COMPARE_KEYS.includes(k));
  return [...COMPARE_KEYS, ...extra];
}

/** 각 전설이 "어떤 사람에게 더 맞는지" 한 줄 */
export function compareBlurb(l: LegendRecord): string {
  const [a, b] = legendTopStyles(l, 2).map((k) => STYLE_META[k].trait);
  return `${josa(a, "과/와")} ${josa(b, "을/를")} 원하는 사람에게 맞습니다.`;
}
