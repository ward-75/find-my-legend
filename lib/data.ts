// JSON 데이터 → 타입이 붙은 도메인 객체. UI는 JSON을 직접 import하지 않는다.
import setsJson from "../data/sets.json";
import legendsJson from "../data/legends.json";
import questionsJson from "../data/questions.json";
import personasJson from "../data/personas.json";
import type { CardSet, LegendRecord, Persona, Question } from "./types";

export const SETS: CardSet[] = (setsJson.sets as CardSet[]).slice().sort((a, b) => a.order - b.order);
export const QUESTIONS: Question[] = questionsJson.questions as Question[];
export const QUESTION_VERSION: string = questionsJson.version;
export const PERSONAS: Persona[] = personasJson.personas as Persona[];
export const BASE_LEGENDS: LegendRecord[] = legendsJson.legends as unknown as LegendRecord[];

export function setById(sets: CardSet[], id: string): CardSet | undefined {
  return sets.find((s) => s.id === id);
}

export function championKo(l: LegendRecord): string {
  return l.localization?.championKo || l.officialData.champion;
}

/** "Ahri, Nine-Tailed Fox" */
export function legendFullName(l: LegendRecord): string {
  return `${l.officialData.champion}, ${l.officialData.title}`;
}
