"use client";
import { useToday } from "@/lib/useToday";
import { useId } from "react";
import { SETS } from "@/lib/data";
import { LATEST, filterRecommendationCandidates, isSetReleased, releasedMainSets, resolveCutoff } from "@/lib/setFilter";
import type { CutoffMode, ExperienceLevel, PoolOptions } from "@/lib/types";
import { EXPERIENCE_LEVELS, EXPERIENCE_META } from "@/lib/experience";
import { useLegendStore } from "./store";
import { Button } from "./ui";

/** 세트를 발매 순서대로 레일 위에 놓고, cutoff까지 불이 켜지는 방식으로 "누적 카드풀"을 보여준다. */
export function SetSelector({ pool, onChange, onStart, onBack, experience, onExperienceChange }: {
  pool: PoolOptions;
  onChange: (p: PoolOptions) => void;
  onStart: () => void;
  onBack: () => void;
  experience: ExperienceLevel;
  onExperienceChange: (v: ExperienceLevel) => void;
}) {
  const { legends } = useLegendStore();
  const uid = useId();
  const today = useToday();
  const mains = SETS.filter((s) => !s.isSupplemental);
  const supplementals = SETS.filter((s) => s.isSupplemental);
  const cutoffSet = resolveCutoff(SETS, pool.cutoff, today);
  const latest = releasedMainSets(SETS, today).at(-1);
  const count = (p: PoolOptions) => filterRecommendationCandidates(legends, SETS, p, today).length;
  const total = count(pool);

  const lit = (order: number) => !!cutoffSet && (pool.mode === "only" ? order === cutoffSet.order : order <= cutoffSet.order);

  return (
    <section className="anim-fade mx-auto max-w-2xl px-5 pb-20 pt-8">
      <Button variant="quiet" onClick={onBack} className="-ml-2">처음으로</Button>
      <h1 className="mt-4 font-display text-[clamp(26px,4.5vw,38px)] font-semibold leading-snug">먼저 플레이 경험을 알려주세요</h1>
      <p className="mt-2 text-vellum/75">
        완전 입문자는 카드 용어 대신 쉬운 표현으로 질문하고, 첫 전설로 너무 어려운 선택은 살짝 낮춰 추천합니다.
      </p>
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {EXPERIENCE_LEVELS.map((level) => {
          const m = EXPERIENCE_META[level];
          const on = experience === level;
          return (
            <button key={level} type="button" aria-pressed={on} onClick={() => onExperienceChange(level)}
              className={`rounded-xl border p-4 text-left transition-colors ${on ? "border-vellum bg-white/[0.07]" : "border-rim hover:border-haze"}`}>
              <span className="block font-medium">{m.label}</span>
              <span className="mt-1 block text-xs leading-5 text-haze">{m.description}</span>
            </button>
          );
        })}
      </div>

      <h2 className="mt-10 font-display text-[clamp(24px,4vw,32px)] font-semibold leading-snug">어느 확장팩까지 포함할까요?</h2>
      <p className="mt-2 text-vellum/75">
        고른 세트와 그 이전에 나온 세트의 전설이 모두 추천 후보가 됩니다. 가진 카드나 참가하는 대회 환경에 맞춰 고르세요.
      </p>

      <button
        type="button"
        onClick={() => onChange({ ...pool, cutoff: LATEST })}
        aria-pressed={pool.cutoff === LATEST}
        className={`mt-7 flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left transition-colors ${
          pool.cutoff === LATEST ? "border-vellum bg-white/[0.06]" : "border-rim hover:border-haze"
        }`}
      >
        <span>
          <span className="block font-medium">최신 세트까지</span>
          <span className="text-sm text-haze">지금은 {latest?.name}까지. 등록된 다음 세트의 발매일이 되면 자동으로 넓어집니다.</span>
        </span>
        <span className="shrink-0 text-sm text-haze">후보 {count({ ...pool, cutoff: LATEST })}명</span>
      </button>

      <ol className="relative mt-6" aria-label="세트 발매 순서">
        {mains.map((s, i) => {
          const on = lit(s.order);
          const released = isSetReleased(s, today);
          const selected = pool.cutoff === s.id || (pool.cutoff === LATEST && s.id === latest?.id);
          const nextOn = i < mains.length - 1 && lit(mains[i + 1].order) && pool.mode === "cumulative";
          const sup = supplementals.filter((x) => x.order === s.order);
          return (
            <li key={s.id} className="relative pb-2 pl-10">
              {/* 레일 */}
              {i < mains.length - 1 && (
                <span aria-hidden className={`absolute left-[13px] top-7 h-[calc(100%-12px)] w-0.5 ${nextOn ? "bg-vellum" : "bg-rim"}`} />
              )}
              <span
                aria-hidden
                className={`absolute left-[7px] top-[18px] h-3.5 w-3.5 rotate-45 border-2 ${
                  on ? "border-vellum bg-vellum" : released ? "border-haze bg-abyss" : "border-rim bg-abyss"
                }`}
              />
              <button
                type="button"
                disabled={!released}
                onClick={() => onChange({ ...pool, cutoff: s.id })}
                aria-pressed={pool.cutoff === s.id}
                className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors ${
                  selected ? "bg-white/[0.07]" : released ? "hover:bg-white/[0.04]" : ""
                } ${!released ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <span>
                  <span className={`block ${on ? "text-vellum" : "text-vellum/70"}`}>
                    <span className="font-medium">{s.name}</span>
                    {pool.mode === "cumulative" ? "까지" : "만"}
                    <span className="ml-2 text-sm text-haze">{s.koreanName}</span>
                  </span>
                  <span className="text-xs text-haze">
                    {released ? `${s.code} · ${s.releaseDate?.slice(0, 7).replace("-", ".")} 발매` : `출시일에 자동 활성화 (${s.releaseDate ?? "미정"} 예정)`}
                  </span>
                </span>
                {released && <span className="shrink-0 text-sm text-haze">후보 {count({ ...pool, cutoff: s.id })}명</span>}
              </button>
              {sup.length > 0 && (
                <p className={`ml-4 mt-1 text-xs ${pool.includeSupplemental && on ? "text-vellum/80" : "text-haze/70"}`}>
                  보조 세트 {sup.map((x) => `${x.name} (${x.code})`).join(", ")} {pool.includeSupplemental ? "포함" : "제외"}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <details className="mt-6 rounded-xl border border-rim px-5 py-4">
        <summary className="cursor-pointer select-none font-medium">고급 옵션</summary>
        <fieldset className="mt-4 space-y-2">
          <legend className="mb-1 text-sm text-haze">카드풀 범위</legend>
          {([["cumulative", "선택한 세트까지 모두 포함"], ["only", "선택한 세트에서 출시된 전설만"]] as [CutoffMode, string][]).map(([m, label]) => (
            <label key={m} className="flex cursor-pointer items-center gap-3">
              <input type="radio" name={`${uid}-mode`} checked={pool.mode === m} onChange={() => onChange({ ...pool, mode: m })} className="accent-[#ece4d0]" />
              {label}
            </label>
          ))}
        </fieldset>
        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <input type="checkbox" checked={pool.includeSupplemental} onChange={(e) => onChange({ ...pool, includeSupplemental: e.target.checked })} className="accent-[#ece4d0]" />
          보조 세트 포함 <span className="text-sm text-haze">(Proving Grounds 스타터 전설 4종)</span>
        </label>
      </details>

      <div className="sticky bottom-0 mt-8 flex items-center justify-between gap-4 border-t border-rim bg-abyss/90 py-4 backdrop-blur">
        <p className="text-sm text-haze">추천 후보 <span className="font-display text-lg text-vellum">{total}</span>명</p>
        <Button variant="primary" disabled={total === 0} onClick={onStart}>
          질문 시작하기
        </Button>
      </div>
      {total === 0 && <p className="mt-2 text-sm text-fury">이 범위에는 추천 준비가 완료된 전설이 없습니다. 다른 세트나 "선택한 세트까지 모두 포함"을 고르세요.</p>}
    </section>
  );
}
