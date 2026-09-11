// 데이터 무결성: `npm run validate:data` 로 단독 실행 가능
import { describe, expect, it } from "vitest";
import { BASE_LEGENDS, SETS, QUESTIONS, PERSONAS } from "../lib/data";
import { validateLegend, parseLegendImport, mergeLegends } from "../lib/validate";
import { ALL_WEIGHT_KEYS } from "../lib/scoring";
import { formatAbility, splitAbilities } from "../lib/format";
import { josa } from "../lib/josa";
import { isSetReleased } from "../lib/setFilter";

describe("data integrity", () => {
  it("모든 전설이 오류 없이 검증된다", () => {
    const errors = BASE_LEGENDS.flatMap((l) => validateLegend(l, SETS)).filter((i) => i.level === "error");
    expect(errors).toEqual([]);
  });
  it("전설 id는 카드 단위로 고유", () => {
    const ids = BASE_LEGENDS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("같은 챔피언의 다른 Legend가 별개로 존재 (Master Yi)", () => {
    expect(BASE_LEGENDS.filter((l) => l.officialData.champion === "Master Yi").map((l) => l.id).sort())
      .toEqual(["master-yi-wuju-bladesman-ogs", "master-yi-wuju-master-unl"]);
  });
  it("미출시 세트의 전설은 등록하지 않는다", () => {
    const unreleased = SETS.filter((s) => !isSetReleased(s)).map((s) => s.id);
    expect(BASE_LEGENDS.filter((l) => unreleased.includes(l.officialData.setId))).toEqual([]);
  });
  it("모든 전설에 출처 URL과 원문 능력 텍스트가 있다", () => {
    for (const l of BASE_LEGENDS) {
      expect(l.officialData.sourceUrls.length, l.id).toBeGreaterThan(0);
      expect(l.officialData.abilityText, l.id).toBeTruthy();
    }
  });
  it("질문·별칭의 가중치 키가 유효하다", () => {
    const valid = new Set<string>(ALL_WEIGHT_KEYS);
    const keys: string[] = [];
    for (const q of QUESTIONS) {
      if (q.type === "choice") q.options.forEach((o) => keys.push(...Object.keys(o.weights)));
      else keys.push(...Object.keys(q.left), ...Object.keys(q.right));
    }
    PERSONAS.forEach((p) => keys.push(...Object.keys(p.signature)));
    expect(keys.filter((k) => !valid.has(k))).toEqual([]);
  });
  it("질문 수는 12~16개, 선택지는 4~5개", () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(12);
    expect(QUESTIONS.length).toBeLessThanOrEqual(16);
    for (const q of QUESTIONS) if (q.type === "choice") expect(q.options.length).toBeGreaterThanOrEqual(4), expect(q.options.length).toBeLessThanOrEqual(5);
  });
});

describe("JSON import", () => {
  it("평면형(명세 7절) 입력을 정규화하고 누락 점수는 needsReview", () => {
    const text = JSON.stringify([{ id: "new-legend-rad", champion: "Test", title: "Tester", setId: "origins", domains: ["Fury", "Mind"], difficulty: 2 }]);
    const r = parseLegendImport(text, SETS);
    expect(r.legends).toHaveLength(1);
    expect(r.legends[0].officialData.domains).toEqual(["fury", "mind"]);
    expect(r.legends[0].recommendationData.needsReview).toBe(true);
    expect(r.legends[0].recommendationData.domainScores.fury).toBe(90);
  });
  it("알 수 없는 setId는 오류로 거부", () => {
    const r = parseLegendImport(JSON.stringify({ id: "x-y", champion: "A", title: "B", setId: "nope", domains: ["fury"] }), SETS);
    expect(r.legends).toHaveLength(0);
    expect(r.issues.some((i) => i.level === "error")).toBe(true);
  });
  it("JSON 문법 오류를 알려준다", () => {
    expect(parseLegendImport("{oops", SETS).issues[0].message).toMatch(/JSON/);
  });
  it("같은 id는 교체, 새 id는 추가", () => {
    const edited = { ...BASE_LEGENDS[0], recommendationData: { ...BASE_LEGENDS[0].recommendationData, difficulty: 1 } };
    const merged = mergeLegends(BASE_LEGENDS, [edited]);
    expect(merged).toHaveLength(BASE_LEGENDS.length);
    expect(merged.find((l) => l.id === edited.id)?.recommendationData.difficulty).toBe(1);
  });
});

describe("text helpers", () => {
  it("붙어 있는 능력 텍스트를 줄 단위로 나눈다", () => {
    const sett = BASE_LEGENDS.find((l) => l.id === "sett-the-boss-ogn")!;
    expect(splitAbilities(sett.officialData.abilityText!)).toHaveLength(2);
    const yi = BASE_LEGENDS.find((l) => l.id === "master-yi-wuju-master-unl")!;
    expect(splitAbilities(yi.officialData.abilityText!)).toHaveLength(2);
    const teemo = BASE_LEGENDS.find((l) => l.id === "teemo-swift-scout-ogn")!;
    const lines = formatAbility(teemo.officialData.abilityText);
    expect(lines).toHaveLength(2);
    expect(lines[1].some((s) => s.kind === "icon" && s.icon === "exhaust")).toBe(true);
  });
  it("조사 선택", () => {
    expect(josa("아리", "은/는")).toBe("아리는");
    expect(josa("리 신", "은/는")).toBe("리 신은");
    expect(josa("템포", "과/와")).toBe("템포와");
    expect(josa("공격성", "과/와")).toBe("공격성과");
    expect(josa("Hidden", "을/를")).toBe("Hidden을(를)");
  });
});
