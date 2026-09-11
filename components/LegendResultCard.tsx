"use client";
import { useLanguage, LocaleText } from "@/lib/i18n/react";
import { displayLegendName } from "@/lib/i18n/names";
import { useState } from "react";
import { SETS, setById } from "@/lib/data";
import { DOMAIN_META, DIFFICULTY_LABELS, archetypeLabel } from "@/lib/labels";
import { cautions, matchReasons, summarySentence } from "@/lib/explain";
import type { ExperienceLevel, LegendMatch, UserProfile } from "@/lib/types";
import { experienceGuidance } from "@/lib/experience";
import { LegendArt } from "./LegendArt";
import { WhyMatch } from "./WhyMatch";
import { Button, Chip, Difficulty, DomainBadge } from "./ui";

interface Props {
  match: LegendMatch;
  profile: UserProfile;
  inCompare: boolean;
  compareFull: boolean;
  onToggleCompare: (id: string) => void;
  onOpenDetail: (id: string) => void;
  /** Results가 TOP 5 전체를 보고 배정한 주의 문구 (없으면 카드 단독 계산) */
  cautionList?: string[];
  experience: ExperienceLevel;
}

function CompareToggle({ on, disabled, onClick }: { on: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <LocaleText><Button variant="ghost" aria-pressed={on} disabled={!on && disabled} onClick={onClick} className={on ? "border-brass text-brass" : ""}>
      {on ? "비교에 담김" : "비교에 담기"}
    </Button></LocaleText>
  );
}

function Reasons({ profile, match, max = 5, warnList }: { profile: UserProfile; match: LegendMatch; max?: number; warnList?: string[] }) {
  const good = matchReasons(profile, match.legend).slice(0, max);
  const warn = warnList ?? cautions(profile, match.legend);
  return (
    <LocaleText><div className="grid gap-4 sm:grid-cols-2">
      <div>
        <p className="text-xs text-haze">잘 맞는 이유</p>
        <ul className="mt-1.5 space-y-1 text-[15px]">
          {good.map((r) => (
            <li key={r.text} className="flex gap-2"><span className="text-calm" aria-hidden>✓</span>{r.text}</li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs text-haze">주의할 점</p>
        <ul className="mt-1.5 space-y-1 text-[15px]">
          {warn.map((t) => (
            <li key={t} className="flex gap-2"><span className="text-brass" aria-hidden>△</span>{t}</li>
          ))}
        </ul>
      </div>
    </div></LocaleText>
  );
}

/** 1위: 카드 아트 + 도메인 색 후광 + 큰 적합도 숫자 */
export function MainLegendCard({ match, profile, inCompare, compareFull, onToggleCompare, onOpenDetail, cautionList, experience }: Props) {
  const { locale } = useLanguage();
  const [why, setWhy] = useState(false);
  const l = match.legend;
  const o = l.officialData;
  const r = l.recommendationData;
  const set = setById(SETS, o.setId);
  const guidance = experienceGuidance(experience, r.difficulty);
  const [a, b] = o.domains;
  const ca = DOMAIN_META[a].color;
  const cb = DOMAIN_META[b ?? a].color;

  return (
    <LocaleText><article className="anim-rise relative rounded-2xl border border-rim bg-deep/80 p-5 sm:p-7" aria-labelledby={`legend-${l.id}`}>
      <div className="grid gap-7 md:grid-cols-[minmax(200px,280px)_1fr]">
        <button type="button" onClick={() => onOpenDetail(l.id)} className="relative mx-auto w-[220px] self-start md:w-full" aria-label={`${o.champion} 카드 자세히 보기`}>
          <span
            aria-hidden
            className="anim-halo absolute -inset-3 rounded-[40%] blur-2xl"
            style={{ background: `conic-gradient(from 200deg, ${ca}, ${cb}, ${ca})`, opacity: 0.3 }}
          />
          <span className="relative block"><LegendArt legend={l} eager /></span>
        </button>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-brass">1위</p>
              <h3 id={`legend-${l.id}`} className="font-display text-[clamp(30px,5vw,44px)] font-semibold leading-tight">
                {displayLegendName(l, locale)}
              </h3>
              <p className="text-vellum/80">{o.champion}, {o.title}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display text-[clamp(44px,8vw,68px)] font-semibold leading-none tabular-nums">
                {match.score}<span className="ml-1 text-[0.34em] text-haze">점</span>
              </p>
              <p className="mt-1 text-xs text-haze">추천 점수</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {o.domains.map((d) => <DomainBadge key={d} domain={d} />)}
            <Chip>{set?.name ?? o.setId} · {o.collectorNumber}</Chip>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="flex items-center gap-2 text-haze">난이도 <Difficulty value={r.difficulty} /> <span className="text-vellum/85">{DIFFICULTY_LABELS[r.difficulty]}</span></span>
            <span className="flex flex-wrap gap-1.5">{r.archetypes.map((x) => <Chip key={x}>{archetypeLabel(x)}</Chip>)}</span>
          </div>

          <p className={`mt-4 rounded-lg border px-3 py-2 text-sm ${guidance.tone === "good" ? "border-calm/40 text-calm" : guidance.tone === "warn" ? "border-brass/40 text-brass" : "border-rim text-haze"}`}>{guidance.text}</p>
          <p className="mt-5 text-[16px] leading-7">{summarySentence(profile, l)}</p>
          <p className="mt-2 text-[15px] leading-7 text-vellum/70">{r.playstyleSummary}</p>

          <div className="mt-5"><Reasons profile={profile} match={match} warnList={cautionList} /></div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="primary" aria-expanded={why} onClick={() => setWhy((v) => !v)}>
              {why ? "비교 접기" : "왜 나랑 잘 맞지?"}
            </Button>
            <CompareToggle on={inCompare} disabled={compareFull} onClick={() => onToggleCompare(l.id)} />
            <Button variant="quiet" onClick={() => onOpenDetail(l.id)}>카드 정보</Button>
          </div>
        </div>
      </div>
      {why && <WhyMatch profile={profile} match={match} />}
    </article></LocaleText>
  );
}

/** 2~5위: 가로 행 레이아웃 */
export function CompactLegendCard({ match, profile, inCompare, compareFull, onToggleCompare, onOpenDetail, cautionList, experience }: Props) {
  const { locale } = useLanguage();
  const [why, setWhy] = useState(false);
  const l = match.legend;
  const o = l.officialData;
  const r = l.recommendationData;
  const set = setById(SETS, o.setId);
  const guidance = experienceGuidance(experience, r.difficulty);
  return (
    <LocaleText><article className="anim-rise rounded-2xl border border-rim bg-deep/60 p-4 sm:p-5" style={{ animationDelay: `${150 + match.rank * 80}ms` }}>
      <div className="grid grid-cols-[84px_1fr] gap-4 sm:grid-cols-[108px_1fr]">
        <button type="button" onClick={() => onOpenDetail(l.id)} aria-label={`${o.champion} 카드 자세히 보기`}>
          <LegendArt legend={l} />
        </button>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-haze"><span className="font-display text-vellum">{match.rank}위</span></p>
              <h3 className="font-display text-2xl font-semibold leading-tight">{displayLegendName(l, locale)}</h3>
              <p className="truncate text-sm text-vellum/75">{o.champion}, {o.title}</p>
            </div>
            <p className="shrink-0 font-display text-4xl font-semibold leading-none tabular-nums">
              {match.score}<span className="ml-1 text-sm text-haze">점</span>
            </p>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {o.domains.map((d) => <DomainBadge key={d} domain={d} size="sm" />)}
            <Chip>{set?.code ?? o.setCode}</Chip>
            <span className="ml-1"><Difficulty value={r.difficulty} /></span>
            {r.archetypes.slice(0, 2).map((x) => <Chip key={x}>{archetypeLabel(x)}</Chip>)}
          </div>
          {experience !== "experienced" && <p className={`mt-2 text-xs ${guidance.tone === "warn" ? "text-brass" : "text-haze"}`}>{guidance.text}</p>}
        </div>
      </div>
      <div className="mt-4"><Reasons profile={profile} match={match} max={3} warnList={cautionList} /></div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="ghost" aria-expanded={why} onClick={() => setWhy((v) => !v)}>{why ? "비교 접기" : "왜 나랑 잘 맞지?"}</Button>
        <CompareToggle on={inCompare} disabled={compareFull} onClick={() => onToggleCompare(l.id)} />
      </div>
      {why && <WhyMatch profile={profile} match={match} />}
    </article></LocaleText>
  );
}
