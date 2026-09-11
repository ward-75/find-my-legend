import { QUESTIONS } from "../lib/data";

// 질문 순서: thrill variance interaction board-width payoff-timing complexity
//           win-route resources favorite-card big-threat game-length positioning unit-death opponent-quote
export const ARCHETYPE_ANSWERS: Record<string, number[]> = {
  aggro:   [0, 4, 5, 2, 1, 2, 0, 2, 4, 1, 0, 2, 2, 0],
  control: [1, 2, 1, 3, 4, 3, 1, 0, 1, 0, 2, 1, 1, 1],
  gear:    [2, 2, 3, 4, 4, 4, 3, 3, 2, 2, 1, 2, 1, 3],
  hidden:  [4, 5, 2, 3, 3, 4, 4, 4, 3, 4, 3, 3, 4, 2],
  brawler: [3, 2, 4, 5, 2, 1, 1, 1, 0, 2, 1, 1, 1, 4],
  tokens:  [2, 2, 3, 1, 4, 3, 1, 3, 1, 0, 1, 2, 0, 4],
  mover:   [0, 3, 3, 3, 2, 4, 2, 2, 1, 1, 3, 5, 3, 0],
};

export function assertLength() {
  for (const [k, v] of Object.entries(ARCHETYPE_ANSWERS)) {
    if (v.length !== QUESTIONS.length) throw new Error(`${k} answers length ${v.length} != ${QUESTIONS.length}`);
  }
}
