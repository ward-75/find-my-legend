import { describe, expect, it } from "vitest";
import { SETS, BASE_LEGENDS } from "../lib/data";
import { filterLegendsByPool, filterRecommendationCandidates, isSetReleased, poolSets, resolveCutoff, LATEST } from "../lib/setFilter";
import type { CardSet, LegendRecord } from "../lib/types";

const NOW = new Date(2026, 8, 11, 12, 0, 0); // 2026-09-11 로 고정해 시간에 따라 회귀 테스트가 바뀌지 않게 함
const ids = (s: CardSet[]) => s.map((x) => x.id).sort();

describe("card pool cutoff", () => {
  it("'Spiritforged까지'는 Origins + Spiritforged (+보조 세트)", () => {
    expect(ids(poolSets(SETS, { cutoff: "spiritforged", mode: "cumulative", includeSupplemental: true }, NOW)))
      .toEqual(["origins", "proving-grounds", "spiritforged"]);
    expect(ids(poolSets(SETS, { cutoff: "spiritforged", mode: "cumulative", includeSupplemental: false }, NOW)))
      .toEqual(["origins", "spiritforged"]);
  });

  it("'Vendetta까지'는 1~4번 세트 전부", () => {
    expect(ids(poolSets(SETS, { cutoff: "vendetta", mode: "cumulative", includeSupplemental: false }, NOW)))
      .toEqual(["origins", "spiritforged", "unleashed", "vendetta"]);
  });

  it("'해당 세트만' 모드는 같은 order만", () => {
    expect(ids(poolSets(SETS, { cutoff: "unleashed", mode: "only", includeSupplemental: true }, NOW))).toEqual(["unleashed"]);
    expect(ids(poolSets(SETS, { cutoff: "origins", mode: "only", includeSupplemental: true }, NOW))).toEqual(["origins", "proving-grounds"]);
  });

  it("'최신 세트까지'는 해당 날짜에 출시된 메인 세트 중 order 최댓값", () => {
    expect(resolveCutoff(SETS, LATEST, NOW)?.id).toBe("vendetta");
  });

  it("미출시 세트는 cutoff로 선택할 수 없고 풀에도 들어가지 않는다", () => {
    expect(resolveCutoff(SETS, "radiance", NOW)).toBeNull();
    const all = poolSets(SETS, { cutoff: LATEST, mode: "cumulative", includeSupplemental: true }, NOW);
    expect(all.some((s) => s.id === "radiance")).toBe(false);
  });

  it("전설 후보 수: Origins 12 + OGS 4 + SFD 12 + UNL 12 + VEN 9", () => {
    const count = (cutoff: string, sup: boolean) =>
      filterLegendsByPool(BASE_LEGENDS, SETS, { cutoff, mode: "cumulative", includeSupplemental: sup }, NOW).length;
    expect(count("origins", false)).toBe(12);
    expect(count("origins", true)).toBe(16);
    expect(count("spiritforged", true)).toBe(28);
    expect(count("unleashed", true)).toBe(40);
    expect(count(LATEST, true)).toBe(49);
  });

  it("등록된 새 세트는 releaseDate가 되면 코드 수정 없이 자동 활성화된다", () => {
    const releaseDay = new Date(2026, 9, 23, 12, 0, 0);
    const before = new Date(2026, 9, 22, 12, 0, 0);
    const radiance = SETS.find((s) => s.id === "radiance")!;
    expect(isSetReleased(radiance, before)).toBe(false);
    expect(isSetReleased(radiance, releaseDay)).toBe(true);
    expect(resolveCutoff(SETS, LATEST, releaseDay)?.id).toBe("radiance");

    const newLegend: LegendRecord = { ...BASE_LEGENDS[0], id: "test-legend-rad", officialData: { ...BASE_LEGENDS[0].officialData, setId: "radiance" } };
    const pool = filterLegendsByPool([...BASE_LEGENDS, newLegend], SETS, { cutoff: LATEST, mode: "cumulative", includeSupplemental: true }, releaseDay);
    expect(pool.map((l) => l.id)).toContain("test-legend-rad");
    const only = filterLegendsByPool([...BASE_LEGENDS, newLegend], SETS, { cutoff: LATEST, mode: "only", includeSupplemental: true }, releaseDay);
    expect(only.map((l) => l.id)).toEqual(["test-legend-rad"]);
  });

  it("recommendationReady=false인 신규 전설은 목록 데이터에는 남고 추천 후보에서만 제외된다", () => {
    const base = BASE_LEGENDS[0];
    const pending: LegendRecord = { ...base, id: "pending-review", recommendationData: { ...base.recommendationData, recommendationReady: false } };
    const all = filterLegendsByPool([...BASE_LEGENDS, pending], SETS, { cutoff: LATEST, mode: "cumulative", includeSupplemental: true }, NOW);
    const candidates = filterRecommendationCandidates([...BASE_LEGENDS, pending], SETS, { cutoff: LATEST, mode: "cumulative", includeSupplemental: true }, NOW);
    expect(all.some((l) => l.id === "pending-review")).toBe(true);
    expect(candidates.some((l) => l.id === "pending-review")).toBe(false);
  });
});
