"use client";
import { useLanguage, LocaleText } from "@/lib/i18n/react";
import { displayLegendName } from "@/lib/i18n/names";
import { useToday } from "@/lib/useToday";
import { useMemo, useState } from "react";
import { SETS, championKo, setById } from "@/lib/data";
import { DOMAIN_KEYS } from "@/lib/types";
import { DOMAIN_META, ARCHETYPE_LABELS, DIFFICULTY_LABELS, archetypeLabel } from "@/lib/labels";
import { filterLegendsByPool, LATEST, releasedMainSets } from "@/lib/setFilter";
import { proactiveIndex } from "@/lib/recommendation";
import type { CutoffMode, DomainKey, LegendMatch, LegendRecord } from "@/lib/types";
import { useLegendStore } from "./store";
import { LegendArt } from "./LegendArt";
import { Button, Chip, Difficulty } from "./ui";

type Sort = "release" | "name" | "aggressive" | "easy";
const SORTS: [Sort, string][] = [["release", "출시순"], ["name", "이름순"], ["aggressive", "공격적 → 수비적"], ["easy", "쉬움 → 어려움"]];

const selectCls = "rounded-lg border border-rim bg-deeper px-3 py-2 text-sm text-vellum";

export function LegendBrowser({ matches, compareIds, onToggleCompare, onOpenDetail, onBack }: {
  matches: LegendMatch[];
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onBack: () => void;
}) {
  const { locale } = useLanguage();
  const { legends } = useLegendStore();
  const today = useToday();
  const [q, setQ] = useState("");
  const [cutoff, setCutoff] = useState<string>(LATEST);
  const [mode, setMode] = useState<CutoffMode>("cumulative");
  const [sup, setSup] = useState(true);
  const [domains, setDomains] = useState<DomainKey[]>([]);
  const [arch, setArch] = useState("");
  const [diff, setDiff] = useState(0);
  const [sort, setSort] = useState<Sort>("release");

  const setOrder = (l: LegendRecord) => setById(SETS, l.officialData.setId)?.order ?? 99;
  const pct = (id: string) => matches.find((m) => m.legend.id === id)?.score;
  const usedArchetypes = useMemo(() => Object.keys(ARCHETYPE_LABELS).filter((a) => legends.some((l) => l.recommendationData.archetypes.includes(a))), [legends]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = filterLegendsByPool(legends, SETS, { cutoff, mode, includeSupplemental: sup }, today).filter((l) => {
      const o = l.officialData;
      if (needle && ![o.champion, o.title, championKo(l)].some((s) => s.toLowerCase().includes(needle))) return false;
      if (domains.length && !domains.every((d) => o.domains.includes(d))) return false;
      if (arch && !l.recommendationData.archetypes.includes(arch)) return false;
      if (diff && l.recommendationData.difficulty !== diff) return false;
      return true;
    });
    const byName = (a: LegendRecord, b: LegendRecord) => championKo(a).localeCompare(championKo(b), "ko");
    out.sort((a, b) => {
      switch (sort) {
        case "name": return byName(a, b) || setOrder(a) - setOrder(b);
        case "aggressive": return proactiveIndex(b.recommendationData.scores) - proactiveIndex(a.recommendationData.scores);
        case "easy": return a.recommendationData.difficulty - b.recommendationData.difficulty || byName(a, b);
        default: return setOrder(a) - setOrder(b) || a.officialData.collectorNumber.localeCompare(b.officialData.collectorNumber);
      }
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legends, q, cutoff, mode, sup, domains, arch, diff, sort, today]);

  const toggleDomain = (d: DomainKey) => setDomains((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : prev.length >= 2 ? [prev[1], d] : [...prev, d]));
  const reset = () => { setQ(""); setCutoff(LATEST); setMode("cumulative"); setSup(true); setDomains([]); setArch(""); setDiff(0); };

  return (
    <LocaleText><section className="mx-auto max-w-6xl px-5 pb-32 pt-8">
      <Button variant="quiet" onClick={onBack} className="-ml-2">돌아가기</Button>
      <h1 className="mt-3 font-display text-[clamp(28px,5vw,40px)] font-semibold">모든 전설</h1>
      <p className="mt-1 text-vellum/75">출시된 세트의 전설을 세트, 도메인, 성향으로 찾아보세요.{matches.length > 0 && " 테스트 결과가 있으면 적합도가 함께 표시됩니다."}</p>

      <div className="mt-6 space-y-4 rounded-2xl border border-rim bg-deep/50 p-4 sm:p-5">
        <div className="flex flex-wrap gap-3">
          <label className="min-w-[200px] flex-1">
            <span className="sr-only">챔피언 이름 검색</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="챔피언 이름 검색 (예: 아리, Yasuo)" className={`${selectCls} w-full`} />
          </label>
          <label className="flex items-center gap-2 text-sm text-haze">정렬
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={selectCls}>
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2 text-haze">확장팩
            <select value={cutoff} onChange={(e) => setCutoff(e.target.value)} className={selectCls}>
              <option value={LATEST}>최신 세트</option>
              {releasedMainSets(SETS, today).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <select value={mode} onChange={(e) => setMode(e.target.value as CutoffMode)} className={selectCls} aria-label="범위">
            <option value="cumulative">까지 모두</option>
            <option value="only">에서 출시된 것만</option>
          </select>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={sup} onChange={(e) => setSup(e.target.checked)} className="accent-[#ece4d0]" /> 보조 세트 포함
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="도메인 필터 (최대 2개, 모두 포함)">
          {DOMAIN_KEYS.map((d) => {
            const on = domains.includes(d);
            const m = DOMAIN_META[d];
            return (
              <button key={d} type="button" aria-pressed={on} onClick={() => toggleDomain(d)}
                className="rounded-full border px-3 py-1 text-sm transition-colors"
                style={on ? { borderColor: m.color, background: m.tint, color: m.color } : { borderColor: "var(--color-rim)", color: "var(--color-haze)" }}>
                {m.label}
              </button>
            );
          })}
          <span className="mx-1 h-5 w-px bg-rim" aria-hidden />
          <select value={arch} onChange={(e) => setArch(e.target.value)} className={selectCls} aria-label="아키타입">
            <option value="">모든 아키타입</option>
            {usedArchetypes.map((a) => <option key={a} value={a}>{archetypeLabel(a)}</option>)}
          </select>
          <select value={diff} onChange={(e) => setDiff(Number(e.target.value))} className={selectCls} aria-label="난이도">
            <option value={0}>모든 난이도</option>
            {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{d} {DIFFICULTY_LABELS[d]}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-haze">
        <p aria-live="polite">{list.length}장</p>
        <button type="button" onClick={reset} className="underline underline-offset-4 hover:text-vellum">필터 초기화</button>
      </div>

      {list.length === 0 ? (
        <p className="mt-10 text-center text-haze">조건에 맞는 전설이 없습니다.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-5">
          {list.map((l) => {
            const inCmp = compareIds.includes(l.id);
            const p = pct(l.id);
            return (
              <li key={l.id} className="group">
                <button type="button" onClick={() => onOpenDetail(l.id)} className="block w-full text-left" aria-label={`${l.officialData.champion}, ${l.officialData.title} 자세히 보기`}>
                  <span className="block transition-transform duration-200 group-hover:-translate-y-1"><LegendArt legend={l} /></span>
                </button>
                <div className="mt-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg leading-tight">{displayLegendName(l, locale)}</p>
                    <p className="truncate text-xs text-haze">{l.officialData.title}</p>
                  </div>
                  {p !== undefined && <span className="shrink-0 font-display tabular-nums">{p}점</span>}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {l.officialData.domains.map((d) => (
                    <span key={d} className="text-xs font-medium" style={{ color: DOMAIN_META[d].color }}>{DOMAIN_META[d].label}</span>
                  ))}
                  <Chip>{l.officialData.setCode}</Chip>
                  {l.recommendationData.recommendationReady === false && <Chip tone="warn">추천 준비 중</Chip>}
                  <Difficulty value={l.recommendationData.difficulty} />
                </div>
                <button type="button" aria-pressed={inCmp} disabled={!inCmp && compareIds.length >= 3} onClick={() => onToggleCompare(l.id)}
                  className={`mt-2 text-xs underline-offset-4 hover:underline disabled:opacity-40 ${inCmp ? "text-brass" : "text-haze"}`}>
                  {inCmp ? "비교에 담김" : "비교에 담기"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section></LocaleText>
  );
}
