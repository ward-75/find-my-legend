"use client";
import { useLanguage, LocaleText } from "@/lib/i18n/react";
import { displayLegendName } from "@/lib/i18n/names";
import { SETS, setById } from "@/lib/data";
import { STYLE_META, DIFFICULTY_LABELS } from "@/lib/labels";
import { compareBlurb, compareKeys } from "@/lib/explain";
import type { LegendMatch, LegendRecord, UserProfile } from "@/lib/types";
import { LegendArt } from "./LegendArt";
import { Button, DomainBadge, Sheet } from "./ui";

/** 최대 3명 비교. profile이 있으면 "당신" 열과 적합도 행을 함께 보여준다. */
export function LegendCompare({ open, onClose, legends, profile, matches, onRemove }: {
  open: boolean;
  onClose: () => void;
  legends: LegendRecord[];
  profile: UserProfile | null;
  matches: LegendMatch[];
  onRemove: (id: string) => void;
}) {
  const { locale } = useLanguage();
  const keys = compareKeys(profile);
  const pct = (id: string) => matches.find((m) => m.legend.id === id)?.score;
  const best = profile && legends.length > 1
    ? legends.slice().sort((a, b) => (pct(b.id) ?? 0) - (pct(a.id) ?? 0))[0]
    : null;

  return (
    <LocaleText><Sheet open={open} onClose={onClose} title={`전설 비교 (${legends.length}/3)`} wide>
      {legends.length === 0 ? (
        <p className="text-haze">비교할 전설을 결과 화면이나 전설 목록에서 담아 주세요.</p>
      ) : (
        <>
          {best && pct(best.id) !== undefined && (
            <p className="mb-4 text-[15px]">당신과 가장 가까운 선택은 <span className="font-display text-lg">{displayLegendName(best, locale)}</span>입니다.</p>
          )}
          <div className="scroll-x -mx-5 px-5">
            <table className="w-full min-w-[560px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="w-28" />
                  {legends.map((l) => (
                    <th key={l.id} className="px-2 pb-3 align-bottom font-normal">
                      <div className="mx-auto w-20"><LegendArt legend={l} /></div>
                      <p className="mt-2 font-display text-base text-vellum">{displayLegendName(l, locale)}</p>
                      <p className="text-xs text-haze">{l.officialData.title}</p>
                      <button type="button" className="mt-1 text-xs text-haze underline underline-offset-2 hover:text-vellum" onClick={() => onRemove(l.id)}>빼기</button>
                    </th>
                  ))}
                  {profile && <th className="px-2 pb-3 align-bottom font-display text-base font-normal text-vellum">당신</th>}
                </tr>
              </thead>
              <tbody>
                {profile && (
                  <tr>
                    <th className="border-t border-rim py-2.5 pr-2 text-left font-normal text-haze">추천 점수</th>
                    {legends.map((l) => (
                      <td key={l.id} className="border-t border-rim px-2 py-2.5 text-center font-display text-xl tabular-nums">{pct(l.id) ?? "-"}점</td>
                    ))}
                    <td className="border-t border-rim" />
                  </tr>
                )}
                <tr>
                  <th className="border-t border-rim py-2.5 pr-2 text-left font-normal text-haze">도메인</th>
                  {legends.map((l) => (
                    <td key={l.id} className="border-t border-rim px-2 py-2.5 text-center">
                      <span className="inline-flex flex-wrap justify-center gap-1">{l.officialData.domains.map((d) => <DomainBadge key={d} domain={d} size="sm" />)}</span>
                    </td>
                  ))}
                  {profile && <td className="border-t border-rim" />}
                </tr>
                <tr>
                  <th className="border-t border-rim py-2.5 pr-2 text-left font-normal text-haze">세트</th>
                  {legends.map((l) => <td key={l.id} className="border-t border-rim px-2 py-2.5 text-center">{setById(SETS, l.officialData.setId)?.name}</td>)}
                  {profile && <td className="border-t border-rim" />}
                </tr>
                <tr>
                  <th className="border-t border-rim py-2.5 pr-2 text-left font-normal text-haze">난이도</th>
                  {legends.map((l) => <td key={l.id} className="border-t border-rim px-2 py-2.5 text-center">{l.recommendationData.difficulty} <span className="text-haze">{DIFFICULTY_LABELS[l.recommendationData.difficulty]}</span></td>)}
                  {profile && <td className="border-t border-rim px-2 py-2.5 text-center text-haze">{(1 + (profile.styles.complexity / 100) * 4).toFixed(1)}</td>}
                </tr>
                {keys.map((k) => {
                  const vals = legends.map((l) => l.recommendationData.scores[k]);
                  const max = Math.max(...vals);
                  return (
                    <tr key={k}>
                      <th className="border-t border-rim py-2.5 pr-2 text-left font-normal text-haze">{STYLE_META[k].label}</th>
                      {legends.map((l) => {
                        const v = l.recommendationData.scores[k];
                        const top = legends.length > 1 && v === max;
                        return (
                          <td key={l.id} className="border-t border-rim px-2 py-2.5">
                            <span className="flex items-center gap-2">
                              <span className="bar-track h-1.5 flex-1 overflow-hidden rounded-full"><span className={`block h-full rounded-full ${top ? "bg-brass" : "bg-vellum/60"}`} style={{ width: `${v}%` }} /></span>
                              <span className={`w-7 text-right tabular-nums ${top ? "text-brass" : ""}`}>{v}</span>
                            </span>
                          </td>
                        );
                      })}
                      {profile && <td className="border-t border-rim px-2 py-2.5 text-center tabular-nums text-vellum/80">{profile.styles[k]}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <ul className="mt-6 space-y-2 text-[15px]">
            {legends.map((l) => (
              <li key={l.id}><span className="font-display">{displayLegendName(l, locale)}</span>: {compareBlurb(l)}</li>
            ))}
          </ul>
          <div className="mt-6 text-right"><Button onClick={onClose}>닫기</Button></div>
        </>
      )}
    </Sheet></LocaleText>
  );
}
