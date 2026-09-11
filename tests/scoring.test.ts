import { describe, expect, it } from "vitest";
import { QUESTIONS } from "../lib/data";
import { answerWeights, computeBounds, computeProfile, normalize, EVIDENCE_FULL_RANGE } from "../lib/scoring";
import { DOMAIN_KEYS, STYLE_KEYS } from "../lib/types";
import type { ScaleQuestion } from "../lib/types";

describe("scoring", () => {
  it("척도형 3은 양쪽 가중치의 절반씩", () => {
    const q = QUESTIONS.find((x) => x.type === "scale") as ScaleQuestion;
    const w = answerWeights(q, 3);
    for (const [k, v] of Object.entries(q.left)) expect(w[k as keyof typeof w]).toBeCloseTo((v as number) / 2 + ((q.right as Record<string, number>)[k] ?? 0) / 2);
  });

  it("모든 profile 값은 0~100", () => {
    const answerSets = [
      QUESTIONS.map((q) => (q.type === "choice" ? 0 : 1)),
      QUESTIONS.map((q) => (q.type === "choice" ? q.options.length - 1 : 5)),
      QUESTIONS.map((q) => (q.type === "choice" ? 2 : 3)),
    ];
    for (const a of answerSets) {
      const p = computeProfile(QUESTIONS, a);
      for (const d of DOMAIN_KEYS) expect(p.domains[d]).toBeGreaterThanOrEqual(0), expect(p.domains[d]).toBeLessThanOrEqual(100);
      for (const s of STYLE_KEYS) expect(p.styles[s]).toBeGreaterThanOrEqual(0), expect(p.styles[s]).toBeLessThanOrEqual(100);
    }
  });

  it("측정 근거가 적은 차원은 50 쪽으로 수축", () => {
    expect(normalize(4, 0, 4)).toBe(Math.round(50 + 50 * (4 / EVIDENCE_FULL_RANGE)));
    expect(normalize(20, 0, 20)).toBe(100);
    expect(normalize(0, 0, 0)).toBe(50);
  });

  it("모든 도메인·스타일 차원이 최소 한 문항에서 측정된다", () => {
    const b = computeBounds(QUESTIONS);
    for (const k of Object.keys(b.max) as (keyof typeof b.max)[]) expect(b.max[k] - b.min[k], k).toBeGreaterThan(0);
  });

  it("공격형으로 답하면 aggression > control", () => {
    const aggro = [0, 4, 5, 2, 1, 2, 0, 2, 4, 1, 0, 2, 2, 0];
    const p = computeProfile(QUESTIONS, aggro);
    expect(p.styles.aggression).toBeGreaterThan(80);
    expect(p.styles.aggression).toBeGreaterThan(p.styles.control + 40);
    expect(p.domains.fury).toBeGreaterThan(p.domains.calm);
  });
});
