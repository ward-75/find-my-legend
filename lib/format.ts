// Riftcodex 원문 텍스트의 아이콘 토큰(:rb_exhaust: 등)을 화면용 조각으로 분해한다.
export type Segment =
  | { kind: "text"; text: string }
  | { kind: "reminder"; text: string }
  | { kind: "keyword"; text: string }
  | { kind: "icon"; icon: "exhaust" | "energy" | "power" | "might" | "arrow"; value?: string }
  | { kind: "break" };

const TOKEN = /(:rb_exhaust:|:rb_energy_(\d+):|:rb_rune_rainbow:|:rb_might:|\[>\]|\[[A-Za-z][A-Za-z0-9 ]*\]|\([^()]*\))/g;

export const ICON_HELP: Record<string, string> = {
  exhaust: "소진(Exhaust): 이 카드를 기울여 사용",
  energy: "에너지 비용",
  power: "파워: 아무 도메인 룬 1",
  might: "힘(Might)",
  arrow: "조건 충족 시",
};

export function splitAbilities(raw: string): string[] {
  // 원문은 여러 능력이 줄바꿈 없이 붙어 있다: "...draw 1.When you..." / "...move.)When..."
  return raw
    .replace(/\.(?=(:rb_|\[|[A-Z]))/g, ".\n")
    .replace(/\)(?=[A-Z[])/g, ")\n")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function tokenize(line: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ kind: "text", text: line.slice(last, idx) });
    const t = m[0];
    if (t === ":rb_exhaust:") out.push({ kind: "icon", icon: "exhaust" });
    else if (t.startsWith(":rb_energy_")) out.push({ kind: "icon", icon: "energy", value: m[2] });
    else if (t === ":rb_rune_rainbow:") out.push({ kind: "icon", icon: "power" });
    else if (t === ":rb_might:") out.push({ kind: "icon", icon: "might" });
    else if (t === "[>]") out.push({ kind: "icon", icon: "arrow" });
    else if (t.startsWith("[")) out.push({ kind: "keyword", text: t.slice(1, -1) });
    else out.push({ kind: "reminder", text: t });
    last = idx + t.length;
  }
  if (last < line.length) out.push({ kind: "text", text: line.slice(last) });
  return out;
}

export function formatAbility(raw: string | null): Segment[][] {
  if (!raw) return [];
  return splitAbilities(raw).map(tokenize);
}
