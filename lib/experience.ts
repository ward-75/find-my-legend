import type { ExperienceLevel } from "./types";

export const EXPERIENCE_LEVELS: ExperienceLevel[] = ["new", "some", "experienced"];

export const EXPERIENCE_META: Record<ExperienceLevel, { label: string; shortLabel: string; description: string }> = {
  new: {
    label: "완전 처음이에요",
    shortLabel: "첫 입문",
    description: "규칙과 카드 용어를 거의 몰라도 괜찮아요. 쉬운 표현으로 질문하고, 첫 전설로 다루기 어려운 선택은 조금 낮춰 추천해요.",
  },
  some: {
    label: "몇 번 해봤어요",
    shortLabel: "기본 경험",
    description: "전장, 룬, 유닛 같은 기본 흐름은 알아요. 기존 질문 표현을 쓰고, 아주 높은 난이도만 살짝 보정해요.",
  },
  experienced: {
    label: "익숙한 편이에요",
    shortLabel: "경험자",
    description: "덱과 전설의 차이를 어느 정도 알아요. 난이도 보정 없이 플레이 취향을 그대로 반영해요.",
  },
};

/** 추천 점수(0~1)에서 빼는 소프트 패널티. 어려운 전설을 금지하지는 않는다. */
export function experienceDifficultyPenalty(level: ExperienceLevel, difficulty: number): number {
  const d = Math.max(1, Math.min(5, Math.round(difficulty)));
  if (level === "new") return [0, 0, 0.02, 0.07, 0.13][d - 1];
  if (level === "some") return [0, 0, 0, 0.025, 0.06][d - 1];
  return 0;
}

export function experienceGuidance(level: ExperienceLevel, difficulty: number): { tone: "good" | "neutral" | "warn"; text: string } {
  if (level === "experienced") return { tone: "neutral", text: "난이도 보정 없음" };
  if (level === "some") {
    if (difficulty <= 3) return { tone: "good", text: "몇 판 경험이 있다면 무리 없이 도전할 만해요" };
    if (difficulty === 4) return { tone: "neutral", text: "조금 익숙해질수록 강점이 잘 보이는 전설이에요" };
    return { tone: "warn", text: "운영 선택지가 많아 충분히 연습한 뒤 도전하는 편이 좋아요" };
  }
  if (difficulty <= 2) return { tone: "good", text: "첫 전설로 시작하기 좋은 난이도예요" };
  if (difficulty === 3) return { tone: "neutral", text: "처음에도 가능하지만 몇 판 익숙해지면 더 편해져요" };
  if (difficulty === 4) return { tone: "warn", text: "취향은 맞아도 첫 전설로는 조금 어려울 수 있어요" };
  return { tone: "warn", text: "취향은 맞아도 입문 직후보다는 규칙에 익숙해진 뒤 추천해요" };
}
