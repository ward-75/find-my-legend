"use client";
import { PERSONAS, SETS } from "@/lib/data";
import { DOMAIN_META } from "@/lib/labels";
import { pickPersonas } from "@/lib/persona";
import { assignCautions } from "@/lib/explain";
import { resolveCutoff, LATEST } from "@/lib/setFilter";
import type { ExperienceLevel, LegendMatch, PoolOptions, UserProfile } from "@/lib/types";
import { EXPERIENCE_META } from "@/lib/experience";
import { DomainRadar } from "./DomainRadar";
import { StyleChart } from "./StyleChart";
import { CompactLegendCard, MainLegendCard } from "./LegendResultCard";
import { ShareCard } from "./ShareCard";
import { Button, Chip } from "./ui";

export function Results({ profile, ranked, tasteTop, experience, pool, shareUrl, compareIds, onToggleCompare, onOpenDetail, onRetake, onBrowse, fromShare }: {
  profile: UserProfile;
  ranked: LegendMatch[];
  tasteTop: LegendMatch | null;
  experience: ExperienceLevel;
  pool: PoolOptions;
  shareUrl: string;
  compareIds: string[];
  onToggleCompare: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onRetake: () => void;
  onBrowse: () => void;
  fromShare: boolean;
}) {
  const { primary, secondary } = pickPersonas(profile, PERSONAS);
  const top5 = ranked.slice(0, 5);
  const cutoff = resolveCutoff(SETS, pool.cutoff);
  const accent = DOMAIN_META[primary.domain].color;
  const full = compareIds.length >= 3;
  const cautionMap = assignCautions(profile, top5.map((m) => m.legend));
  const cardProps = (m: LegendMatch) => ({
    match: m, profile, inCompare: compareIds.includes(m.legend.id), compareFull: full, onToggleCompare, onOpenDetail,
    cautionList: cautionMap[m.legend.id], experience,
  });

  return (
    <div className="mx-auto max-w-6xl px-5 pb-32 pt-8">
      {fromShare && (
        <p className="mb-6 rounded-xl border border-rim bg-deep/60 px-4 py-3 text-sm text-vellum/85">
          공유받은 결과입니다. 나도 해 보고 싶다면 <button type="button" onClick={onRetake} className="underline underline-offset-4">테스트 시작</button>
        </p>
      )}

      <div className="grid gap-10 lg:grid-cols-[360px_1fr]">
        {/* 프로필 */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <p className="text-haze">당신의 플레이스타일은</p>
          <h1 className="anim-fade mt-1 font-display text-[clamp(34px,6vw,48px)] font-semibold leading-tight" style={{ color: accent }}>
            {primary.name}
          </h1>
          <p className="mt-3 text-[16px] leading-7 text-vellum/85">{primary.description}</p>
          {secondary && <p className="mt-2 text-sm text-haze">{secondary.name}의 기질도 엿보입니다.</p>}

          <div className="mt-6 rounded-2xl border border-rim bg-deep/50 p-4">
            <h2 className="text-sm text-haze">도메인 성향</h2>
            <DomainRadar user={profile.domains} height={260} />
          </div>
          <div className="mt-4 rounded-2xl border border-rim bg-deep/50 p-5">
            <h2 className="mb-4 text-sm text-haze">두드러진 스타일 TOP 6</h2>
            <StyleChart profile={profile} />
          </div>
        </aside>

        {/* 추천 */}
        <section aria-labelledby="top5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="top5" className="font-display text-2xl font-semibold">잘 맞는 전설 TOP {top5.length}</h2>
            <div className="flex flex-wrap gap-1.5">
              <Chip>{pool.cutoff === LATEST ? "최신 세트" : cutoff?.name}{pool.mode === "cumulative" ? "까지" : "만"}</Chip>
              <Chip>보조 세트 {pool.includeSupplemental ? "포함" : "제외"}</Chip>
              <Chip>{EXPERIENCE_META[experience].shortLabel}</Chip>
              <Chip>후보 {ranked.length}명</Chip>
            </div>
          </div>

          {experience !== "experienced" && tasteTop && top5[0] && tasteTop.legend.id !== top5[0].legend.id && (
            <div className="mt-5 rounded-xl border border-brass/40 bg-brass/[0.06] px-4 py-3 text-sm leading-6">
              <p>입문 추천 1위: {top5[0].legend.localization?.championKo ?? top5[0].legend.officialData.champion}</p>
              <span className="text-haze">순수 취향 일치 1위: </span>
              <button type="button" onClick={() => onOpenDetail(tasteTop.legend.id)} className="font-display text-brass underline underline-offset-4">
                {tasteTop.legend.localization?.championKo ?? tasteTop.legend.officialData.champion}
              </button>
              <p className="text-haze">지금 순위는 시작 난이도까지 함께 고려한 추천입니다. 어려운 전설도 취향이 맞으면 후보에 남습니다.</p>
            </div>
          )}

          <div className="mt-5 space-y-4">
            {ranked.length === 0 && <p role="status" className="rounded-xl border border-rim p-5 text-haze">이 범위에는 추천 준비가 완료된 전설이 없습니다. 다시 테스트에서 다른 세트를 선택하거나 전설 목록을 확인해 주세요.</p>}
            {top5[0] && <MainLegendCard {...cardProps(top5[0])} />}
            <div className="grid gap-4 xl:grid-cols-2">
              {top5.slice(1).map((m) => <CompactLegendCard key={m.legend.id} {...cardProps(m)} />)}
            </div>
          </div>

          {ranked.length > 5 && (
            <details className="mt-6 rounded-xl border border-rim px-5 py-4">
              <summary className="cursor-pointer select-none">나머지 {ranked.length - 5}명 적합도 보기</summary>
              <ol className="mt-4 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2" start={6}>
                {ranked.slice(5).map((m) => (
                  <li key={m.legend.id} className="flex items-center justify-between gap-3">
                    <button type="button" onClick={() => onOpenDetail(m.legend.id)} className="truncate text-left hover:underline">
                      <span className="mr-2 text-haze">{m.rank}</span>{m.legend.localization?.championKo ?? m.legend.officialData.champion}
                      <span className="ml-1.5 text-haze">{m.legend.officialData.title}</span>
                    </button>
                    <span className="tabular-nums text-vellum/80">{m.score}점</span>
                  </li>
                ))}
              </ol>
            </details>
          )}

          <div className="mt-8">
            {top5[0] && <ShareCard persona={primary} profile={profile} top={top5[0]} url={shareUrl} />}
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Button variant="primary" onClick={onRetake}>다시 테스트</Button>
            <Button onClick={onBrowse}>모든 전설 보기</Button>
          </div>
          <p className="mt-6 text-xs leading-6 text-haze">
            추천 점수와 스타일 수치는 전설 능력 텍스트와 도메인 성향을 근거로 한 서비스 자체 1차 평가값이며 확률(%)이 아니고, 실제 대회 성적이나 메타 순위도 아닙니다. 카드 정보(이름, 세트, 번호, 도메인, 능력 원문)는 출처가 기록된 데이터만 사용합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
