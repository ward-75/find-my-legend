"use client";
import { useLanguage, LocaleText } from "@/lib/i18n/react";
import { displayLegendName } from "@/lib/i18n/names";
import { whyRows, whySentences } from "@/lib/explain";
import type { LegendMatch, UserProfile } from "@/lib/types";
import { DomainRadar } from "./DomainRadar";

const PARTS: [keyof LegendMatch["breakdown"], string, number][] = [
  ["style", "플레이스타일", 40],
  ["domain", "도메인", 30],
  ["difficulty", "난이도 취향", 15],
  ["proactive", "주도/대응", 10],
  ["risk", "안정/고점", 5],
];

/** "왜 나랑 잘 맞지?" — 사용자 점수와 전설 점수를 나란히 비교 */
export function WhyMatch({ profile, match }: { profile: UserProfile; match: LegendMatch }) {
  const { locale } = useLanguage();
  const l = match.legend;
  const name = displayLegendName(l, locale);
  const rows = whyRows(profile, l);
  return (
    <LocaleText><div className="anim-fade mt-4 rounded-xl border border-rim bg-deeper/70 p-4 sm:p-5">
      <div className="space-y-1 text-[15px]">
        {whySentences(profile, l).map((s) => <p key={s}>{s}</p>)}
      </div>

      <table className="mt-4 w-full text-sm">
        <caption className="sr-only">당신과 {name}의 스타일 점수 비교</caption>
        <thead>
          <tr className="text-left text-xs text-haze">
            <th className="pb-2 font-normal">항목</th>
            <th className="pb-2 font-normal">당신</th>
            <th className="pb-2 font-normal">{name}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const gap = Math.abs(r.user - r.legend);
            return (
              <tr key={r.key} className="border-t border-white/5">
                <td className="py-2 pr-3">{r.label}</td>
                <td className="w-[36%] py-2 pr-3">
                  <span className="flex items-center gap-2">
                    <span className="bar-track h-1.5 flex-1 overflow-hidden rounded-full"><span className="block h-full rounded-full bg-vellum" style={{ width: `${r.user}%` }} /></span>
                    <span className="w-7 text-right tabular-nums">{Math.round(r.user)}</span>
                  </span>
                </td>
                <td className="w-[36%] py-2">
                  <span className="flex items-center gap-2">
                    <span className="bar-track h-1.5 flex-1 overflow-hidden rounded-full"><span className="block h-full rounded-full bg-brass" style={{ width: `${r.legend}%` }} /></span>
                    <span className={`w-7 text-right tabular-nums ${gap >= 28 ? "text-brass" : ""}`}>{Math.round(r.legend)}</span>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_1.1fr] sm:items-center">
        <DomainRadar user={profile.domains} compare={{ values: l.recommendationData.domainScores, label: name }} height={210} />
        <div>
          <p className="text-xs text-haze">적합도 구성 (가중치)</p>
          <ul className="mt-2 space-y-2 text-sm">
            {PARTS.map(([k, label, w]) => (
              <li key={k} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-2">
                <span className="text-vellum/85">{label} <span className="text-haze">{w}%</span></span>
                <span className="bar-track h-1.5 overflow-hidden rounded-full"><span className="block h-full rounded-full bg-vellum/70" style={{ width: `${Math.round(match.breakdown[k] * 100)}%` }} /></span>
                <span className="text-right tabular-nums text-haze">{Math.round(match.breakdown[k] * 100)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div></LocaleText>
  );
}
