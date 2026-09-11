// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../components/App";
import { BASE_LEGENDS, QUESTIONS } from "../lib/data";
import { ARCHETYPE_ANSWERS } from "./helpers";
import { EXPERIENCE_META } from "../lib/experience";

// jsdom has no layout or canvas renderer; application state and events remain real.
vi.mock("../components/DomainRadar", () => ({ DomainRadar: () => null }));
beforeEach(() => {
  window.history.replaceState(null, "", "/find-my-legend/");
  window.localStorage.clear();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,test");
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("complete application flows", () => {
  for (const experience of ["new", "some", "experienced"] as const) {
    it(`${experience}: 14 questions → result → comparison → shared reload`, async () => {
      render(createElement(App));
      fireEvent.click(screen.getByRole("button", { name: "테스트 시작" }));
      fireEvent.click(screen.getByRole("button", { name: new RegExp(EXPERIENCE_META[experience].label) }));
      fireEvent.click(screen.getByRole("button", { name: /^Origins까지/ }));
      fireEvent.click(screen.getByRole("button", { name: "질문 시작하기" }));
      for (const [i, q] of QUESTIONS.entries()) {
        expect(screen.getByRole("heading", { level: 2 }).textContent).toBe(experience === "new" ? q.beginnerPrompt : q.prompt);
        const radios = within(screen.getByRole("radiogroup")).getAllByRole("radio");
        const answer = ARCHETYPE_ANSWERS.control[i]!;
        fireEvent.click(radios[q.type === "choice" ? answer : answer - 1]);
        fireEvent.click(screen.getByRole("button", { name: i === QUESTIONS.length - 1 ? "결과 보기" : "다음 질문" }));
      }
      await act(async () => {});
      expect(screen.getByRole("heading", { name: "잘 맞는 전설 TOP 5" })).toBeTruthy();
      const shared = (screen.getByRole("textbox", { name: "공유 링크" }) as HTMLInputElement).value;
      expect(new URL(shared).pathname).toBe("/find-my-legend/");
      expect(shared).toContain(`.c.1.${experience === "new" ? "n" : experience === "some" ? "s" : "e"}.`);
      fireEvent.click(screen.getAllByRole("button", { name: "비교에 담기" })[0]);
      fireEvent.click(screen.getByRole("button", { name: "비교하기" }));
      expect(screen.getByRole("dialog", { name: "전설 비교 (1/3)" })).toBeTruthy();
      fireEvent.click(within(screen.getByRole("dialog")).getAllByRole("button", { name: "닫기" })[0]);
      cleanup();
      window.history.replaceState(null, "", new URL(shared).pathname + new URL(shared).search);
      render(createElement(App));
      await act(async () => {});
      expect(screen.getByRole("heading", { name: "잘 맞는 전설 TOP 5" })).toBeTruthy();
      expect((screen.getByRole("textbox", { name: "공유 링크" }) as HTMLInputElement).value).toBe(shared);
    });
  }
  it("pending imported legend is visible and marked in browser after reload", () => {
    const legend = structuredClone(BASE_LEGENDS[0]);
    legend.id = "test-pending";
    legend.officialData.champion = "Pending Test";
    legend.recommendationData.recommendationReady = false;
    localStorage.setItem("find-my-legend.imported.v1", JSON.stringify([legend]));
    history.replaceState(null, "", "/find-my-legend/?view=legends");
    render(createElement(App));
    fireEvent.change(screen.getByRole("textbox", { name: "챔피언 이름 검색" }), { target: { value: "Pending Test" } });
    expect(screen.getByText("추천 준비 중")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Pending Test.*자세히 보기/ })).toBeTruthy();
  });
  it("malformed persisted data does not crash the app", () => {
    localStorage.setItem("find-my-legend.imported.v1", '{"broken":true}');
    render(createElement(App));
    expect(screen.getByRole("button", { name: "테스트 시작" })).toBeTruthy();
  });
  it("a tab kept open activates a set at local midnight without reload", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 22, 23, 59, 59));
    render(createElement(App));
    fireEvent.click(screen.getByRole("button", { name: "테스트 시작" }));
    expect((screen.getByRole("button", { name: /^Radiance까지/ }) as HTMLButtonElement).disabled).toBe(true);
    act(() => { vi.advanceTimersByTime(1100); });
    expect((screen.getByRole("button", { name: /^Radiance까지/ }) as HTMLButtonElement).disabled).toBe(false);
  });
});
