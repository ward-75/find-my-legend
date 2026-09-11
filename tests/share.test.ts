import { describe, expect, it } from "vitest";
import { QUESTIONS, QUESTION_VERSION } from "../lib/data";
import { decodeState, encodeState } from "../lib/share";

describe("share", () => {
  const state = { questionVersion: QUESTION_VERSION, cutoff: "spiritforged", mode: "only" as const, includeSupplemental: false, experience: "new" as const,
    answers: QUESTIONS.map((q) => (q.type === "choice" ? 1 : 4)) };

  it("인코딩 → 디코딩 왕복", () => {
    const code = encodeState(state);
    expect(decodeState(code, QUESTIONS, QUESTION_VERSION)).toEqual(state);
  });
  it("질문 버전이 다르면 거부", () => {
    expect(decodeState(encodeState({ ...state, questionVersion: "q0" }), QUESTIONS, QUESTION_VERSION)).toBeNull();
  });
  it("범위를 벗어난 답은 거부", () => {
    const bad = encodeState(state).replace(/\.[^.]+$/, "." + "9".repeat(QUESTIONS.length));
    expect(decodeState(bad, QUESTIONS, QUESTION_VERSION)).toBeNull();
  });
});
