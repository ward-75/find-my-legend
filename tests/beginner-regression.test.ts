import { describe, expect, it } from "vitest";
import { BASE_LEGENDS, QUESTIONS, QUESTION_VERSION, SETS } from "../lib/data";
import { parseLegendImport } from "../lib/validate";
import { filterRecommendationCandidates, DEFAULT_POOL } from "../lib/setFilter";
import { experienceDifficultyPenalty } from "../lib/experience";
import { decodeState, encodeState } from "../lib/share";
import { computeProfile } from "../lib/scoring";
import { rankLegends } from "../lib/recommendation";
import { ARCHETYPE_ANSWERS } from "./helpers";

const now = new Date(2026, 8, 11, 12);
describe("beginner release regressions", () => {
  it("explicitly pending imports remain pending after persistence roundtrip", () => {
    const pending = structuredClone(BASE_LEGENDS[0]);
    pending.recommendationData.recommendationReady = false;
    const first = parseLegendImport(JSON.stringify([pending]), SETS);
    const second = parseLegendImport(JSON.stringify(first.legends), SETS);
    expect(second.legends).toHaveLength(1);
    expect(second.legends[0].recommendationData.recommendationReady).toBe(false);
    expect(filterRecommendationCandidates(second.legends, SETS, DEFAULT_POOL, now)).toEqual([]);
  });
  it("incomplete imported scoring cannot opt into recommendations", () => {
    const pending = { ...BASE_LEGENDS[0], recommendationData: { recommendationReady: true, difficulty: 2 } };
    const result = parseLegendImport(JSON.stringify(pending), SETS);
    expect(result.legends).toHaveLength(1);
    expect(result.legends[0].recommendationData.recommendationReady).toBe(false);
  });
  it("all beginner-visible questions and answers avoid Riftbound jargon", () => {
    for (const q of QUESTIONS) {
      expect(q.beginnerPrompt, q.id).toBeTruthy();
      const texts = q.type === "choice"
        ? [q.beginnerPrompt, ...q.options.map((o) => o.beginnerLabel ?? o.label)]
        : [q.beginnerPrompt, q.beginnerLeftLabel ?? q.leftLabel, q.beginnerRightLabel ?? q.rightLabel];
      for (const text of texts) expect(text, q.id).not.toMatch(/(^|\s)룬|유닛|전장|보드|손패|도메인|히든|Hidden|Deathknell|Gear|템포|램프/i);
    }
  });
  it("difficulty adjustments soften with experience and never remove candidates", () => {
    const pool = filterRecommendationCandidates(BASE_LEGENDS, SETS, DEFAULT_POOL, now);
    const profile = computeProfile(QUESTIONS, ARCHETYPE_ANSWERS.control);
    for (const level of ["new", "some", "experienced"] as const) {
      expect(rankLegends(profile, pool, { experience: level })).toHaveLength(pool.length);
      for (let d = 1; d <= 5; d++) {
        const penalty = experienceDifficultyPenalty(level, d);
        expect(penalty).toBeLessThanOrEqual(experienceDifficultyPenalty("new", d));
        if (level === "experienced") expect(penalty).toBe(0);
      }
    }
  });
  it("share roundtrips every experience level and rejects malformed flags", () => {
    for (const experience of ["new", "some", "experienced"] as const) {
      const state = { questionVersion: QUESTION_VERSION, cutoff: "origins", mode: "cumulative" as const, includeSupplemental: true, experience, answers: ARCHETYPE_ANSWERS.control };
      const code = encodeState(state);
      expect(decodeState(code, QUESTIONS, QUESTION_VERSION)).toEqual(state);
      for (const [index, value] of [[2, "x"], [3, "x"], [4, "toString"]] as const) {
        const parts = code.split("."); parts[index] = value;
        expect(decodeState(parts.join("."), QUESTIONS, QUESTION_VERSION)).toBeNull();
      }
    }
  });
});

describe("import URL security", () => {
  for (const url of ["javascript:alert(1)", "data:text/html,<script>alert(1)</script>", "http://example.com", "https://user:secret@example.com"]) {
    it(`rejects unsafe source/image URL: ${url.split(':')[0]}`, () => {
      const legend = structuredClone(BASE_LEGENDS[0]);
      legend.officialData.sourceUrls = [url];
      legend.officialData.imageUrl = url;
      expect(parseLegendImport(JSON.stringify(legend), SETS).legends).toHaveLength(0);
    });
  }
  it("limits oversized import payloads", () => {
    expect(parseLegendImport(" ".repeat(5_000_001), SETS).issues[0].level).toBe("error");
  });
});
