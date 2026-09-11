// 답변 → 사용자 profile(0~100). 각 차원은 "이 질문지로 가능한 최소~최대" 범위로 정규화하고,
// 측정 근거(가능 범위)가 작은 차원은 50 쪽으로 당겨 한두 문항만으로 극단값이 나오지 않게 한다.
import { DOMAIN_KEYS, STYLE_KEYS } from "./types";
import type { Answers, DomainVector, Question, StyleVector, UserProfile, WeightKey, Weights } from "./types";

export const ALL_WEIGHT_KEYS: WeightKey[] = [
  ...DOMAIN_KEYS.map((d) => `domain.${d}` as WeightKey),
  ...STYLE_KEYS.map((s) => `style.${s}` as WeightKey),
];

/** 가능 범위가 이 값 이상이면 정규화 값을 그대로 쓰고, 작으면 비례해서 50 쪽으로 수축 */
export const EVIDENCE_FULL_RANGE = 8;

export const SCALE_POINTS = [1, 2, 3, 4, 5] as const;

function lerpWeights(left: Weights, right: Weights, t: number): Weights {
  const out: Weights = {};
  for (const k of new Set([...Object.keys(left), ...Object.keys(right)]) as Set<WeightKey>) {
    out[k] = (left[k] ?? 0) * (1 - t) + (right[k] ?? 0) * t;
  }
  return out;
}

/** 한 문항의 답 → 가중치 */
export function answerWeights(q: Question, answer: number): Weights {
  if (q.type === "choice") return q.options[answer]?.weights ?? {};
  const t = (Math.min(5, Math.max(1, answer)) - 1) / 4;
  return lerpWeights(q.left, q.right, t);
}

/** 문항이 가질 수 있는 모든 답 */
function possibleAnswers(q: Question): number[] {
  return q.type === "choice" ? q.options.map((_, i) => i) : [...SCALE_POINTS];
}

export interface Bounds {
  min: Record<WeightKey, number>;
  max: Record<WeightKey, number>;
}

export function computeBounds(questions: Question[]): Bounds {
  const min = Object.fromEntries(ALL_WEIGHT_KEYS.map((k) => [k, 0])) as Record<WeightKey, number>;
  const max = Object.fromEntries(ALL_WEIGHT_KEYS.map((k) => [k, 0])) as Record<WeightKey, number>;
  for (const q of questions) {
    const all = possibleAnswers(q).map((a) => answerWeights(q, a));
    for (const k of ALL_WEIGHT_KEYS) {
      const vals = all.map((w) => w[k] ?? 0);
      min[k] += Math.min(...vals);
      max[k] += Math.max(...vals);
    }
  }
  return { min, max };
}

export function rawTotals(questions: Question[], answers: Answers): Record<WeightKey, number> {
  const tot = Object.fromEntries(ALL_WEIGHT_KEYS.map((k) => [k, 0])) as Record<WeightKey, number>;
  questions.forEach((q, i) => {
    const a = answers[i];
    if (a === null || a === undefined) return;
    const w = answerWeights(q, a);
    for (const k of Object.keys(w) as WeightKey[]) tot[k] += w[k] ?? 0;
  });
  return tot;
}

export function normalize(raw: number, min: number, max: number): number {
  const range = max - min;
  if (range <= 0) return 50;
  const n = ((raw - min) / range) * 100;
  const shrink = Math.min(1, range / EVIDENCE_FULL_RANGE);
  return Math.round(50 + (n - 50) * shrink);
}

export function computeProfile(questions: Question[], answers: Answers): UserProfile {
  const b = computeBounds(questions);
  const tot = rawTotals(questions, answers);
  const domains = {} as DomainVector;
  const styles = {} as StyleVector;
  for (const d of DOMAIN_KEYS) domains[d] = normalize(tot[`domain.${d}`], b.min[`domain.${d}`], b.max[`domain.${d}`]);
  for (const s of STYLE_KEYS) styles[s] = normalize(tot[`style.${s}`], b.min[`style.${s}`], b.max[`style.${s}`]);
  return { domains, styles };
}

export function isComplete(questions: Question[], answers: Answers): boolean {
  return questions.every((_, i) => answers[i] !== null && answers[i] !== undefined);
}

/** profile에서 가중치 키로 값 읽기 */
export function profileValue(p: UserProfile, key: WeightKey): number {
  const [kind, id] = key.split(".") as ["domain" | "style", string];
  return kind === "domain" ? p.domains[id as keyof DomainVector] : p.styles[id as keyof StyleVector];
}
