"use client";
import { LocaleText } from "@/lib/i18n/react";
import { formatAbility, tokenize, ICON_HELP, type Segment } from "@/lib/format";

function Icon({ seg }: { seg: Extract<Segment, { kind: "icon" }> }) {
  const common = "mx-0.5 inline-flex h-[1.35em] min-w-[1.35em] items-center justify-center rounded-full align-[-0.2em] text-[0.8em] font-semibold";
  switch (seg.icon) {
    case "exhaust":
      return <LocaleText><span title={ICON_HELP.exhaust} aria-label="소진" className={`${common} border border-vellum/60 text-vellum`}>↻</span></LocaleText>;
    case "energy":
      return <LocaleText><span title={ICON_HELP.energy} aria-label={`에너지 ${seg.value}`} className={`${common} bg-vellum text-abyss`}>{seg.value}</span></LocaleText>;
    case "power":
      return (
        <LocaleText><span title={ICON_HELP.power} aria-label="파워 1" className={`${common} text-abyss`}
          style={{ background: "conic-gradient(#f28a3a,#e8474f,#a064e8,#4c8df6,#3db57e,#e3bf45,#f28a3a)" }}>◆</span></LocaleText>
      );
    case "might":
      return <LocaleText><span title={ICON_HELP.might} className="mx-0.5 text-brass">힘</span></LocaleText>;
    case "arrow":
      return <LocaleText><span aria-hidden className="mx-1 text-haze">▸</span></LocaleText>;
  }
}

function Seg({ seg }: { seg: Segment }) {
  if (seg.kind === "text") return <LocaleText><>{seg.text}</></LocaleText>;
  if (seg.kind === "keyword") return <LocaleText><span className="rounded bg-white/[0.08] px-1 py-px text-[0.92em] font-medium text-vellum">{seg.text}</span></LocaleText>;
  if (seg.kind === "icon") return <LocaleText><Icon seg={seg} /></LocaleText>;
  if (seg.kind === "reminder") {
    const inner = tokenize(seg.text.slice(1, -1));
    return (
      <LocaleText><span className="text-haze italic">
        ({inner.map((s, i) => <Seg key={i} seg={s} />)})
      </span></LocaleText>
    );
  }
  return null;
}

/** 원문(영문) 능력 텍스트를 아이콘과 함께 표시 */
export function AbilityText({ text }: { text: string | null }) {
  const lines = formatAbility(text);
  if (!lines.length) return <LocaleText><p className="text-sm text-haze">능력 텍스트 미등록 (TODO)</p></LocaleText>;
  return (
    <LocaleText><div className="space-y-2 text-[15px] leading-7" lang="en">
      {lines.map((line, i) => (
        <p key={i}>{line.map((s, j) => <Seg key={j} seg={s} />)}</p>
      ))}
    </div></LocaleText>
  );
}
