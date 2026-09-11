import type { Persona, UserProfile, WeightKey } from "./types";
import { profileValue } from "./scoring";

export function personaScore(p: UserProfile, persona: Persona): number {
  let num = 0, den = 0;
  for (const [k, w] of Object.entries(persona.signature) as [WeightKey, number][]) {
    num += w * (profileValue(p, k) - 50);
    den += w;
  }
  return den ? num / den : 0;
}

export function pickPersonas(p: UserProfile, personas: Persona[]): { primary: Persona; secondary: Persona | null } {
  const ranked = personas.map((x) => ({ x, s: personaScore(p, x) })).sort((a, b) => b.s - a.s);
  const primary = ranked[0].x;
  const second = ranked[1];
  // 2순위가 1순위와 충분히 가까울 때만 부가 기질로 표시
  const secondary = second && ranked[0].s - second.s < 8 && second.s > 5 ? second.x : null;
  return { primary, secondary };
}
