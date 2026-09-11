import { describe, expect, it } from "vitest";
import { QUESTIONS, BASE_LEGENDS, SETS } from "../lib/data";
import { computeProfile } from "../lib/scoring";
import { rankLegends } from "../lib/recommendation";
import { filterLegendsByPool, DEFAULT_POOL } from "../lib/setFilter";
import { ARCHETYPE_ANSWERS, assertLength } from "./helpers";
import type { UserProfile } from "../lib/types";

const pool = filterLegendsByPool(BASE_LEGENDS, SETS, DEFAULT_POOL);
const top = (name: string, n = 5) =>
  rankLegends(computeProfile(QUESTIONS, ARCHETYPE_ANSWERS[name]), pool).slice(0, n).map((m) => m.legend.officialData.champion);

describe("recommendation", () => {
  it("테스트 답변 길이 확인", () => assertLength());

  it("전설 자신의 profile을 넣으면 그 전설이 1위", () => {
    for (const l of pool) {
      const p: UserProfile = { styles: { ...l.recommendationData.scores }, domains: { ...l.recommendationData.domainScores } };
      // 난이도 선호를 전설 난이도에 맞춘다
      p.styles.complexity = ((l.recommendationData.difficulty - 1) / 4) * 100;
      const probe = { ...l, recommendationData: { ...l.recommendationData, scores: p.styles } };
      const ranked = rankLegends(p, pool.map((x) => (x.id === l.id ? probe : x)));
      expect(ranked[0].legend.id, l.id).toBe(l.id);
    }
  });

  it("성향별 대표 답변 → 납득 가능한 TOP 5", () => {
    expect(top("aggro").some((c) => ["Jinx", "Rengar", "Draven", "Darius"].includes(c))).toBe(true);
    expect(top("control")).toContain("Ahri");
    expect(top("gear", 3).some((c) => ["Ornn", "Jax", "Jayce"].includes(c))).toBe(true);
    expect(top("hidden", 1)).toEqual(["Teemo"]);
    expect(top("tokens", 1)).toEqual(["Viktor"]);
    expect(top("mover", 2)).toContain("Akali");
  });

  it("표시 %는 전부 90 이상으로 몰리지 않는다", () => {
    for (const answers of Object.values(ARCHETYPE_ANSWERS)) {
      const ranked = rankLegends(computeProfile(QUESTIONS, answers), pool);
      const pct = ranked.map((m) => m.score);
      expect(pct.filter((x) => x >= 90).length).toBeLessThanOrEqual(3);
      expect(pct[0]).toBeGreaterThanOrEqual(80);
      expect(pct[pct.length - 1]).toBeLessThan(50);
      // 순위와 % 순서가 일치
      for (let i = 1; i < pct.length; i++) expect(pct[i]).toBeLessThanOrEqual(pct[i - 1]);
    }
  });

  it("완전 입문자는 고난도 전설에 소프트 보정이 적용되지만 제외되지는 않는다", () => {
    const p = computeProfile(QUESTIONS, ARCHETYPE_ANSWERS.control);
    const base = pool[0];
    const easy = { ...base, id: "easy-probe", recommendationData: { ...base.recommendationData, difficulty: 1 } };
    const hard = { ...base, id: "hard-probe", recommendationData: { ...base.recommendationData, difficulty: 5 } };
    const r = rankLegends(p, [hard, easy], { experience: "new" });
    expect(r).toHaveLength(2);
    expect(r[0].legend.id).toBe("easy-probe");
    expect(r.find((x) => x.legend.id === "hard-probe")?.experiencePenalty).toBeGreaterThan(0);
  });

  it("후보가 1명뿐이어도 동작", () => {
    const r = rankLegends(computeProfile(QUESTIONS, ARCHETYPE_ANSWERS.aggro), pool.slice(0, 1));
    expect(r).toHaveLength(1);
    expect(r[0].score).toBeGreaterThan(0);
  });
});

import { assignCautions } from "../lib/explain";

describe("explanations", () => {
  it("TOP 5 카드의 주의 문구가 서로 반복되지 않는다", () => {
    for (const answers of Object.values(ARCHETYPE_ANSWERS)) {
      const p = computeProfile(QUESTIONS, answers);
      const top5 = rankLegends(p, pool).slice(0, 5).map((m) => m.legend);
      const map = assignCautions(p, top5);
      const all = Object.values(map).flat();
      expect(new Set(all).size).toBe(all.length);
      for (const l of top5) expect(map[l.id].length).toBeGreaterThan(0);
    }
  });
});
