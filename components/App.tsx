"use client";
import { LanguageProvider, LanguageSelector, useLanguage, LocaleText } from "@/lib/i18n/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QUESTIONS, QUESTION_VERSION, SETS } from "@/lib/data";
import { computeProfile, isComplete } from "@/lib/scoring";
import { rankLegends } from "@/lib/recommendation";
import { DEFAULT_POOL, filterRecommendationCandidates, resolveCutoff } from "@/lib/setFilter";
import { decodeState, encodeState } from "@/lib/share";
import type { Answers, ExperienceLevel, PoolOptions } from "@/lib/types";
import { LegendStoreProvider, useLegendStore } from "./store";
import { Landing } from "./Landing";
import { SetSelector } from "./SetSelector";
import { Quiz } from "./Quiz";
import { Results } from "./Results";
import { LegendBrowser } from "./LegendBrowser";
import { LegendCompare } from "./LegendCompare";
import { LegendDetail } from "./LegendDetail";
import { DataAdmin } from "./DataAdmin";
import { Button } from "./ui";

import { withLanguage } from "@/lib/i18n/core";
import { useToday } from "@/lib/useToday";

type View = "landing" | "setup" | "quiz" | "result" | "browse" | "data";
const EMPTY: Answers = QUESTIONS.map(() => null);

// URL ↔ 화면: ?view=start|test|legends|data, 결과는 ?r=<인코딩된 답변>
function urlFor(view: View, code?: string): string {
  const q = view === "result" && code ? `?r=${code}`
    : view === "setup" ? "?view=start"
    : view === "quiz" ? "?view=test"
    : view === "browse" ? "?view=legends"
    : view === "data" ? "?view=data" : "";
  return window.location.pathname + q;
}

function Shell() {
  const { legends } = useLegendStore();
  const { locale } = useLanguage();
  const today = useToday();
  const [view, setView] = useState<View>("landing");
  const [pool, setPool] = useState<PoolOptions>(DEFAULT_POOL);
  const [experience, setExperience] = useState<ExperienceLevel>("new");
  const [answers, setAnswers] = useState<Answers>(EMPTY);
  const [qIndex, setQIndex] = useState(0);
  const [fromShare, setFromShare] = useState(false);
  const [shareError, setShareError] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const navigate = useCallback((next: View, code?: string, replace = false) => {
    setView(next);
    const url = withLanguage(urlFor(next, code), locale);
    try {
      if (replace) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    } catch {
      // 샌드박스 iframe 등 history를 쓸 수 없는 환경: 화면 전환만 한다
    }
    window.scrollTo({ top: 0 });
  }, [locale]);

  // 첫 진입과 뒤로/앞으로 가기: URL을 읽어 화면을 복원
  useEffect(() => {
    const read = () => {
      const sp = new URLSearchParams(window.location.search);
      const r = sp.get("r");
      const v = sp.get("view");
      setShareError(false);
      if (r) {
        const s = decodeState(r, QUESTIONS, QUESTION_VERSION);
        if (s && isComplete(QUESTIONS, s.answers) && resolveCutoff(SETS, s.cutoff)) {
          setAnswers((prev) => {
            const same = prev.length === s.answers.length && prev.every((a, i) => a === s.answers[i]);
            if (!same) setFromShare(true);
            return s.answers;
          });
          setPool({ cutoff: s.cutoff, mode: s.mode, includeSupplemental: s.includeSupplemental });
          setExperience(s.experience);
          setView("result");
          return;
        }
        setShareError(true);
        setView("landing");
        return;
      }
      if (v === "start") setView("setup");
      else if (v === "test") setView("quiz");
      else if (v === "legends") setView("browse");
      else if (v === "data") setView("data");
      else setView("landing");
    };
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);

  const profile = useMemo(() => (isComplete(QUESTIONS, answers) ? computeProfile(QUESTIONS, answers) : null), [answers]);
  const candidates = useMemo(() => filterRecommendationCandidates(legends, SETS, pool, today), [legends, pool, today]);
  const ranked = useMemo(() => (profile ? rankLegends(profile, candidates, { experience }) : []), [profile, candidates, experience]);
  const tasteRanked = useMemo(() => (profile ? rankLegends(profile, candidates, { experience: "experienced" }) : []), [profile, candidates]);
  const allMatches = useMemo(() => {
    if (!profile) return [];
    const selected = new Map(ranked.map((m) => [m.legend.id, m]));
    return rankLegends(profile, filterRecommendationCandidates(legends, SETS, DEFAULT_POOL, today), { experience })
      .map((m) => selected.get(m.legend.id) ?? m);
  }, [profile, legends, experience, ranked, today]);

  const resultCode = useMemo(() => {
    const cutoff = resolveCutoff(SETS, pool.cutoff, today)?.id ?? pool.cutoff; // "최신"은 공유 시점의 세트로 고정
    return encodeState({ questionVersion: QUESTION_VERSION, cutoff, mode: pool.mode, includeSupplemental: pool.includeSupplemental, experience, answers });
  }, [pool, experience, answers, today]);
  const shareUrl = typeof window === "undefined" ? "" : `${window.location.origin}${window.location.pathname}?r=${resultCode}&lang=${locale}`;

  const toggleCompare = useCallback((id: string) => {
    setCompareIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 3 ? prev : [...prev, id]));
  }, []);

  const startSetup = () => { setFromShare(false); navigate("setup"); };
  const startQuiz = () => { setAnswers(EMPTY); setQIndex(0); navigate("quiz"); };
  const finish = () => navigate("result", resultCode);

  // 퀴즈 URL로 바로 들어왔는데 진행 상태가 없으면 세트 선택으로
  useEffect(() => {
    if (view === "quiz" && answers.every((a) => a === null) && qIndex > 0) setQIndex(0);
    if (view === "result" && !profile) navigate("landing", undefined, true);
  }, [view, answers, qIndex, profile, navigate]);

  const compareLegends = compareIds.map((id) => legends.find((l) => l.id === id)).filter((l): l is NonNullable<typeof l> => !!l);
  const detail = detailId ? legends.find((l) => l.id === detailId) ?? null : null;
  const showCompareBar = compareIds.length > 0 && (view === "result" || view === "browse");

  return (
    <LocaleText><div className="min-h-svh">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-abyss/85 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-6xl gap-2 py-2 items-center justify-between px-5">
          <button type="button" onClick={() => navigate("landing")} className="font-display text-lg font-semibold tracking-tight">
            Find My Legend
          </button>
          <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
            <LanguageSelector />
            {profile && view !== "result" && <Button variant="quiet" onClick={() => navigate("result", resultCode)}>내 결과</Button>}
            <Button variant="quiet" onClick={() => navigate("browse")} aria-current={view === "browse" ? "page" : undefined}>전설 목록</Button>
          </nav>
        </div>
      </header>

      <main>
        {shareError && view === "landing" && (
          <p className="mx-auto mt-6 max-w-6xl px-5 text-sm text-brass" role="alert">
            공유 링크를 읽지 못했습니다. 질문지가 바뀌었거나 링크가 잘렸을 수 있어요. 새로 테스트해 보세요.
          </p>
        )}
        {view === "landing" && <Landing onStart={startSetup} onBrowse={() => navigate("browse")} />}
        {view === "setup" && <SetSelector pool={pool} onChange={setPool} onStart={startQuiz} onBack={() => navigate("landing")} experience={experience} onExperienceChange={setExperience} />}
        {view === "quiz" && (
          <Quiz
            answers={answers}
            index={qIndex}
            onAnswer={(i, v) => setAnswers((prev) => prev.map((a, j) => (j === i ? v : a)))}
            onIndex={setQIndex}
            onFinish={finish}
            onExit={() => navigate("setup")}
            experience={experience}
          />
        )}
        {view === "result" && profile && (
          <Results
            profile={profile}
            ranked={ranked}
            tasteTop={tasteRanked[0] ?? null}
            experience={experience}
            pool={pool}
            shareUrl={shareUrl}
            compareIds={compareIds}
            onToggleCompare={toggleCompare}
            onOpenDetail={setDetailId}
            onRetake={startSetup}
            onBrowse={() => navigate("browse")}
            fromShare={fromShare}
          />
        )}
        {view === "browse" && (
          <LegendBrowser matches={allMatches} compareIds={compareIds} onToggleCompare={toggleCompare} onOpenDetail={setDetailId} onBack={() => window.history.length > 1 ? window.history.back() : navigate("landing")} />
        )}
        {view === "data" && <DataAdmin onBack={() => navigate("landing")} />}
      </main>

      {showCompareBar && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rim bg-deep/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
            <p className="text-sm text-haze">비교함 <span className="font-display text-base text-vellum">{compareIds.length}</span> / 3</p>
            <div className="flex gap-2">
              <Button variant="quiet" onClick={() => setCompareIds([])}>비우기</Button>
              <Button variant="primary" onClick={() => setCompareOpen(true)}>비교하기</Button>
            </div>
          </div>
        </div>
      )}

      <LegendCompare
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        legends={compareLegends}
        profile={profile}
        matches={allMatches}
        onRemove={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
      />
      <LegendDetail
        legend={detail}
        onClose={() => setDetailId(null)}
        inCompare={!!detailId && compareIds.includes(detailId)}
        compareFull={compareIds.length >= 3}
        onToggleCompare={toggleCompare}
      />

      <footer className={`border-t border-white/5 px-5 py-8 text-xs leading-6 text-haze ${showCompareBar ? "pb-24" : ""}`}>
        <div className="mx-auto max-w-6xl">
          <p>
            카드 데이터 출처: Riftcodex API, riftdecks.com (각 전설 상세에 개별 링크). 카드 이미지는 Riot Games 서버의 원본을 직접 불러옵니다.
          </p>
          <p className="mt-1">
            Find My Legend는 Riot Games의 &quot;Legal Jibber Jabber&quot; 정책에 따라 Riot Games 소유 자산을 사용한 팬 프로젝트이며, Riot Games가 보증하거나 후원하지 않습니다.
          </p>
        </div>
      </footer>
    </div></LocaleText>
  );
}

export default function App() {
  return (
    <LanguageProvider><LegendStoreProvider>
      <Shell />
    </LegendStoreProvider></LanguageProvider>
  );
}
