"use client";
import { SETS, championKo, setById } from "@/lib/data";
import { STYLE_META, DIFFICULTY_LABELS, archetypeLabel } from "@/lib/labels";
import { legendTopStyles } from "@/lib/explain";
import { experienceGuidance } from "@/lib/experience";
import type { LegendRecord } from "@/lib/types";
import { AbilityText } from "./AbilityText";
import { LegendArt } from "./LegendArt";
import { Bar, Button, Chip, Difficulty, DomainBadge, Sheet } from "./ui";

/** 카드 정보 시트: 공식 데이터와 서비스 평가값을 분리해서 보여준다 */
export function LegendDetail({ legend, onClose, inCompare, compareFull, onToggleCompare }: {
  legend: LegendRecord | null;
  onClose: () => void;
  inCompare: boolean;
  compareFull: boolean;
  onToggleCompare: (id: string) => void;
}) {
  if (!legend) return null;
  const o = legend.officialData;
  const r = legend.recommendationData;
  const set = setById(SETS, o.setId);
  const top = legendTopStyles(legend, 6);
  return (
    <Sheet open={!!legend} onClose={onClose} title={`${championKo(legend)} · ${o.title}`} wide>
      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        <div className="mx-auto w-[220px] md:w-full"><LegendArt legend={legend} eager /></div>
        <div className="min-w-0 space-y-6">
          <section>
            <h3 className="font-display text-2xl font-semibold">{o.champion}, {o.title}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {o.domains.map((d) => <DomainBadge key={d} domain={d} />)}
            </div>
            <dl className="mt-4 grid grid-cols-[6rem_1fr] gap-y-1.5 text-sm">
              <dt className="text-haze">세트</dt><dd>{set ? `${set.name} (${set.code})` : o.setId}{set?.isSupplemental && <span className="ml-2"><Chip>보조 세트</Chip></span>}</dd>
              <dt className="text-haze">카드 번호</dt><dd>{o.collectorNumber || "TODO"}</dd>
              {o.artist && (<><dt className="text-haze">일러스트</dt><dd>{o.artist}</dd></>)}
              <dt className="text-haze">출처</dt>
              <dd className="space-y-0.5">
                {o.sourceUrls.length ? o.sourceUrls.map((u) => (
                  <a key={u} href={u} target="_blank" rel="noreferrer" className="block truncate text-vellum/80 underline underline-offset-2 hover:text-vellum">{u.replace(/^https?:\/\//, "")}</a>
                )) : "TODO"}
              </dd>
            </dl>
            {o.dataNote && <p className="mt-2 text-xs text-haze">데이터 메모: {o.dataNote}</p>}
          </section>

          <section>
            <h4 className="text-sm text-haze">전설 능력 (원문)</h4>
            <div className="mt-2 rounded-xl border border-rim bg-deeper/60 p-4"><AbilityText text={o.abilityText} /></div>
          </section>

          <section>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm text-haze">서비스 평가</h4>
              {r.needsReview && <Chip tone="warn">수치 검토 중</Chip>}
              {r.recommendationReady === false && <Chip tone="warn">추천 준비 중</Chip>}
            </div>
            <p className="mt-2 text-[15px] leading-7">{r.playstyleSummary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center gap-2">난이도 <Difficulty value={r.difficulty} /> {DIFFICULTY_LABELS[r.difficulty]}</span>
              <span className="flex flex-wrap gap-1.5">{r.archetypes.map((a) => <Chip key={a}>{archetypeLabel(a)}</Chip>)}</span>
            </div>
            <p className="mt-3 text-sm text-haze">입문 안내: {r.recommendationReady === false ? "추천 수치를 검토 중이므로 난이도 안내도 아직 확정되지 않았어요." : experienceGuidance("new", r.difficulty).text}</p>
            <ul className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {top.map((k) => (
                <li key={k} className="grid grid-cols-[5.5rem_1fr_2rem] items-center gap-2 text-sm">
                  <span>{STYLE_META[k].label}</span><Bar value={r.scores[k]} /><span className="text-right tabular-nums">{r.scores[k]}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 text-[15px]">
              <div>
                <p className="text-xs text-haze">강점</p>
                <ul className="mt-1 space-y-1">{r.strengths.map((s) => <li key={s} className="flex gap-2"><span className="text-calm">✓</span>{s}</li>)}</ul>
              </div>
              <div>
                <p className="text-xs text-haze">약점</p>
                <ul className="mt-1 space-y-1">{r.weaknesses.map((s) => <li key={s} className="flex gap-2"><span className="text-brass">△</span>{s}</li>)}</ul>
              </div>
            </div>
            {r.reviewNote && <p className="mt-3 text-xs text-haze">{r.reviewNote}</p>}
          </section>

          <div className="flex gap-2">
            <Button variant="ghost" aria-pressed={inCompare} disabled={!inCompare && compareFull} onClick={() => onToggleCompare(legend.id)} className={inCompare ? "border-brass text-brass" : ""}>
              {inCompare ? "비교에 담김" : "비교에 담기"}
            </Button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}
