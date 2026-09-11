"use client";
import { useLanguage, LocaleText } from "@/lib/i18n/react";
import { displayLegendName } from "@/lib/i18n/names";
import { useMemo, useState } from "react";
import { isSetReleased } from "@/lib/setFilter";
import { BASE_LEGENDS, SETS } from "@/lib/data";
import { parseLegendImport, validateLegend, type Issue } from "@/lib/validate";
import type { LegendRecord } from "@/lib/types";
import { useLegendStore } from "./store";
import { Button, Chip } from "./ui";

const box = "w-full rounded-lg border border-rim bg-deeper p-3 font-mono text-[13px] leading-5 text-vellum";

function IssueList({ issues }: { issues: Issue[] }) {
  if (!issues.length) return null;
  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warning");
  return (
    <LocaleText><div className="mt-3 space-y-2 text-sm">
      <p>
        <span className={errors.length ? "text-fury" : "text-calm"}>오류 {errors.length}건</span>
        <span className="ml-3 text-brass">경고 {warns.length}건</span>
      </p>
      <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-rim p-3">
        {[...errors, ...warns].map((i, n) => (
          <li key={n} className={i.level === "error" ? "text-fury" : "text-haze"}>
            <span className="font-mono">{i.id}</span>: {i.message}
          </li>
        ))}
      </ul>
    </div></LocaleText>
  );
}

function download(name: string, text: string) {
  const blob = new Blob([text], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** 데이터 관리: 새 세트 전설 JSON 가져오기, 추천 수치 조정, 내보내기 */
export function DataAdmin({ onBack }: { onBack: () => void }) {
  const { locale } = useLanguage();
  const { legends, imported, persisted, addImported, clearImported } = useLegendStore();
  const [text, setText] = useState("");
  const [checked, setChecked] = useState<{ legends: LegendRecord[]; issues: Issue[] } | null>(null);
  const [editId, setEditId] = useState(BASE_LEGENDS[0].id);
  const [editText, setEditText] = useState("");
  const [editIssues, setEditIssues] = useState<Issue[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const review = useMemo(() => legends.filter((l) => l.recommendationData.needsReview), [legends]);
  const allIssues = useMemo(() => legends.flatMap((l) => validateLegend(l, SETS)).filter((i) => i.level === "error"), [legends]);
  const countBySet = (id: string) => legends.filter((l) => l.officialData.setId === id).length;

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setText(await f.text());
    setChecked(null);
  };

  const loadEditor = (id: string) => {
    setEditId(id);
    const l = legends.find((x) => x.id === id);
    setEditText(l ? JSON.stringify(l.recommendationData, null, 2) : "");
    setEditIssues([]);
  };

  const applyEdit = () => {
    const l = legends.find((x) => x.id === editId);
    if (!l) return;
    let rec: unknown;
    try { rec = JSON.parse(editText); } catch (e) { setEditIssues([{ level: "error", id: editId, message: `JSON 형식 오류: ${(e as Error).message}` }]); return; }
    const res = parseLegendImport(JSON.stringify({ ...l, recommendationData: rec }), SETS);
    setEditIssues(res.issues);
    if (res.legends.length) { addImported(res.legends); setNotice(`${displayLegendName(l, locale)}의 추천 수치를 적용했습니다.`); }
  };

  return (
    <LocaleText><section className="mx-auto max-w-4xl px-5 pb-32 pt-8">
      <Button variant="quiet" onClick={onBack} className="-ml-2">돌아가기</Button>
      <h1 className="mt-3 font-display text-[clamp(28px,5vw,40px)] font-semibold">데이터 관리</h1>
      <p className="mt-1 text-vellum/75">
        새 확장팩 전설을 JSON으로 추가하거나 추천 수치를 조정합니다. 변경 사항은 이 브라우저에만 적용되며, 배포본에 반영하려면 내려받은 legends.json을 <code className="text-brass">data/</code>에 덮어쓰세요.
      </p>
      {notice && <p className="mt-4 rounded-lg border border-calm/40 px-4 py-2 text-sm text-calm" role="status">{notice}</p>}
      {!persisted && <p className="mt-4 text-sm text-brass">이 환경은 브라우저 저장소를 쓸 수 없어 새로고침하면 가져온 데이터가 사라집니다.</p>}

      {/* 현황 */}
      <div className="mt-8">
        <h2 className="font-display text-xl">세트와 전설 현황</h2>
        <div className="scroll-x mt-3">
          <table className="w-full min-w-[520px] text-sm">
            <thead><tr className="text-left text-xs text-haze"><th className="pb-2 font-normal">순서</th><th className="pb-2 font-normal">세트</th><th className="pb-2 font-normal">코드</th><th className="pb-2 font-normal">발매</th><th className="pb-2 font-normal">상태</th><th className="pb-2 text-right font-normal">전설</th></tr></thead>
            <tbody>
              {SETS.map((s) => (
                <tr key={s.id} className="border-t border-rim">
                  <td className="py-2">{s.order}</td>
                  <td className="py-2">{s.name} {s.isSupplemental && <Chip>보조</Chip>}</td>
                  <td className="py-2 font-mono">{s.code}</td>
                  <td className="py-2">{s.releaseDate ?? "미정"}</td>
                  <td className="py-2">{isSetReleased(s) ? <span className="text-calm">출시</span> : <span className="text-haze">미출시 (후보 제외)</span>}</td>
                  <td className="py-2 text-right tabular-nums">{countBySet(s.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-haze">
          전체 {legends.length}장 · 가져온 데이터 {imported.length}장 · 수치 검토 필요 {review.length}장 · 데이터 오류 {allIssues.length}건
        </p>
      </div>

      {/* 가져오기 */}
      <div className="mt-10">
        <h2 className="font-display text-xl">Legend JSON 가져오기</h2>
        <p className="mt-1 text-sm text-haze">배열, {"{ legends: [...] }"}, 단일 객체 모두 됩니다. 분리형(officialData/recommendationData)과 평면형 필드 모두 받으며, 누락된 점수는 50으로 채우고 검토 필요 + 추천 후보 비활성 상태로 표시합니다. 같은 id는 교체됩니다.</p>
        <textarea value={text} onChange={(e) => { setText(e.target.value); setChecked(null); }} rows={9} className={`${box} mt-3`} placeholder='[{ "id": "ekko-...-rad", "champion": "Ekko", "title": "...", "setId": "radiance", "domains": ["mind","chaos"], ... }]' aria-label="가져올 JSON" />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded-full border border-rim px-5 py-2.5 text-[15px] hover:border-haze">
            파일 선택<input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
          </label>
          <Button variant="ghost" disabled={!text.trim()} onClick={() => setChecked(parseLegendImport(text, SETS))}>검사하기</Button>
          <Button variant="primary" disabled={!checked || checked.legends.length === 0} onClick={() => {
            if (!checked) return;
            addImported(checked.legends);
            setNotice(`전설 ${checked.legends.length}장을 가져왔습니다.`);
            setChecked(null); setText("");
          }}>
            {checked ? `${checked.legends.length}장 적용` : "적용"}
          </Button>
        </div>
        {checked && <IssueList issues={checked.issues} />}
      </div>

      {/* 수치 조정 */}
      <div className="mt-10">
        <h2 className="font-display text-xl">추천 수치 조정</h2>
        <p className="mt-1 text-sm text-haze">공식 카드 정보는 그대로 두고 recommendationData만 수정합니다. 검토를 마친 전설은 needsReview를 false로, 실제 추천에 넣을 준비가 끝나면 recommendationReady를 true로 바꾸세요.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <select value={editId} onChange={(e) => loadEditor(e.target.value)} className="rounded-lg border border-rim bg-deeper px-3 py-2 text-sm">
            {legends.map((l) => <option key={l.id} value={l.id}>{displayLegendName(l, locale)} · {l.officialData.title} ({l.officialData.setCode}){l.recommendationData.needsReview ? " *" : ""}</option>)}
          </select>
          <Button variant="ghost" onClick={() => loadEditor(editId)}>불러오기</Button>
        </div>
        {editText && (
          <>
            <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={14} className={`${box} mt-3`} aria-label="recommendationData 편집" />
            <div className="mt-3"><Button variant="primary" onClick={applyEdit}>수치 적용</Button></div>
            <IssueList issues={editIssues} />
          </>
        )}
      </div>

      {/* 내보내기 */}
      <div className="mt-10">
        <h2 className="font-display text-xl">내보내기와 초기화</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => download("legends.json", JSON.stringify({ schemaVersion: 1, legends }, null, 2))}>legends.json 내려받기</Button>
          <Button variant="ghost" disabled={!imported.length} onClick={() => download("imported-legends.json", JSON.stringify(imported, null, 2))}>가져온 것만 내려받기</Button>
          <Button variant="ghost" disabled={!imported.length} onClick={() => { clearImported(); setNotice("가져온 데이터를 지웠습니다."); }}>가져온 데이터 초기화</Button>
        </div>
        <p className="mt-3 text-sm text-haze">
          새 세트 공식 데이터 초안은 <code className="text-brass">npm run data:fetch -- --set=RAD</code>로 Riftcodex API에서 받아 이 화면에서 가져올 수 있습니다. 추천 수치는 초안에서 모두 검토 필요 상태로 시작합니다.
        </p>
      </div>
    </section></LocaleText>
  );
}
