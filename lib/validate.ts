// Legend JSON 가져오기/데이터 무결성 검사. 분리형(officialData/recommendationData)과
// 평면형(명세 7절의 필드 나열) 둘 다 받아 LegendRecord로 정규화한다.
import { DOMAIN_KEYS, STYLE_KEYS } from "./types";
import type { CardSet, DomainKey, DomainVector, LegendRecord, StyleKey, StyleVector } from "./types";

export interface Issue {
  level: "error" | "warning";
  id: string;
  message: string;
}

type Obj = Record<string, unknown>;
const isObj = (x: unknown): x is Obj => typeof x === "object" && x !== null && !Array.isArray(x);
const str = (x: unknown) => (typeof x === "string" ? x : undefined);
const strArr = (x: unknown) => (Array.isArray(x) ? x.filter((v): v is string => typeof v === "string") : []);

function toStyleVector(x: unknown): { v: StyleVector; filled: StyleKey[] } {
  const src = isObj(x) ? x : {};
  const filled: StyleKey[] = [];
  const v = {} as StyleVector;
  for (const k of STYLE_KEYS) {
    const n = src[k];
    if (typeof n === "number" && Number.isFinite(n)) v[k] = n;
    else { v[k] = 50; filled.push(k); }
  }
  return { v, filled };
}

function toDomainVector(x: unknown, domains: DomainKey[]): DomainVector {
  const src = isObj(x) ? x : null;
  const v = {} as DomainVector;
  for (const k of DOMAIN_KEYS) {
    const n = src?.[k];
    v[k] = typeof n === "number" && Number.isFinite(n) ? n : domains.includes(k) ? 90 : 15;
  }
  return v;
}

/** 입력 하나를 LegendRecord로 정규화 (검증은 validateLegend에서) */
export function normalizeLegendInput(input: unknown): LegendRecord | null {
  if (!isObj(input)) return null;
  const flat = !isObj(input.officialData);
  const off: Obj = flat ? input : (input.officialData as Obj);
  const rec: Obj = flat ? input : isObj(input.recommendationData) ? (input.recommendationData as Obj) : {};
  const loc: Obj = isObj(input.localization) ? (input.localization as Obj) : {};

  const domains = strArr(off.domains).map((d) => d.toLowerCase()) as DomainKey[];
  const { v: scores, filled } = toStyleVector(rec.scores);
  const difficulty = typeof rec.difficulty === "number" ? rec.difficulty : 3;
  const needsReview = rec.needsReview === false && filled.length === 0 ? false : true;
  // 명시적인 비활성 상태를 보존한다. 미완성 수치로 추천을 활성화하지 않는다.
  const recommendationReady = rec.recommendationReady !== false && filled.length === 0
    && typeof rec.difficulty === "number" && isObj(rec.domainScores)
    && DOMAIN_KEYS.every((k) => typeof rec.domainScores === "object"
      && typeof (rec.domainScores as Obj)[k] === "number"
      && Number.isFinite((rec.domainScores as Obj)[k]));

  return {
    id: str(input.id) ?? "",
    officialData: {
      champion: str(off.champion) ?? "",
      title: str(off.title) ?? "",
      setId: str(off.setId) ?? "",
      setCode: str(off.setCode) ?? "",
      collectorNumber: str(off.collectorNumber) ?? "",
      riftboundId: str(off.riftboundId),
      domains,
      abilityText: str(off.abilityText) ?? null,
      imageUrl: str(off.imageUrl) ?? null,
      artist: str(off.artist) ?? null,
      sourceUrls: strArr(off.sourceUrls),
      verifiedAt: str(off.verifiedAt),
      dataNote: str(off.dataNote),
    },
    localization: { championKo: str(loc.championKo) ?? str(input.championKo) ?? null, titleKo: str(loc.titleKo) ?? null },
    recommendationData: {
      recommendationReady,
      difficulty,
      archetypes: strArr(rec.archetypes),
      scores,
      domainScores: toDomainVector(rec.domainScores, domains),
      playstyleSummary: str(rec.playstyleSummary) ?? str(rec.description) ?? "",
      strengths: strArr(rec.strengths),
      weaknesses: strArr(rec.weaknesses),
      recommendedFor: strArr(rec.recommendedFor).filter((k): k is StyleKey => (STYLE_KEYS as readonly string[]).includes(k)),
      notRecommendedFor: strArr(rec.notRecommendedFor).filter((k): k is StyleKey => (STYLE_KEYS as readonly string[]).includes(k)),
      needsReview,
      reviewNote: str(rec.reviewNote) ?? (filled.length ? `누락된 점수 ${filled.length}개를 50으로 채움` : undefined),
    },
  };
}

export function isSafeExternalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch { return false; }
}

export function validateLegend(l: LegendRecord, sets: CardSet[]): Issue[] {
  const issues: Issue[] = [];
  const id = l.id || "(id 없음)";
  const err = (message: string) => issues.push({ level: "error", id, message });
  const warn = (message: string) => issues.push({ level: "warning", id, message });
  const o = l.officialData;
  const r = l.recommendationData;

  if (!l.id) err("id가 없습니다. 카드 단위 고유 id가 필요합니다 (예: ahri-nine-tailed-fox-ogn).");
  else if (!/^[a-z0-9-]+$/.test(l.id)) err("id는 소문자 영문, 숫자, 하이픈만 쓸 수 있습니다.");
  if (!o.champion) err("officialData.champion이 없습니다.");
  if (!o.title) err("officialData.title이 없습니다.");
  if (!sets.some((s) => s.id === o.setId)) err(`setId "${o.setId}"가 sets.json에 없습니다.`);
  if (o.domains.length === 0) err("domains가 비어 있습니다.");
  o.domains.forEach((d) => { if (!(DOMAIN_KEYS as readonly string[]).includes(d)) err(`알 수 없는 도메인: ${d}`); });
  if (!o.collectorNumber) warn("collectorNumber가 비어 있습니다 (TODO).");
  if (!o.abilityText) warn("abilityText가 비어 있습니다 (TODO).");
  if (o.imageUrl && !isSafeExternalUrl(o.imageUrl)) err("imageUrl은 인증정보가 없는 HTTPS 주소여야 합니다.");
  if (o.sourceUrls.some((url) => !isSafeExternalUrl(url))) err("출처는 인증정보가 없는 HTTPS 주소여야 합니다.");
  if (!o.imageUrl) warn("imageUrl이 없습니다. 도메인 색 카드로 대체 표시됩니다.");
  if (o.sourceUrls.length === 0) warn("sourceUrls가 없습니다. 출처를 기록해 주세요.");

  if (!(r.difficulty >= 1 && r.difficulty <= 5)) err("difficulty는 1~5여야 합니다.");
  for (const k of STYLE_KEYS) {
    const v = r.scores[k];
    if (!(v >= 0 && v <= 100)) err(`scores.${k} 값(${v})이 0~100 범위를 벗어났습니다.`);
  }
  for (const k of DOMAIN_KEYS) {
    const v = r.domainScores[k];
    if (!(v >= 0 && v <= 100)) err(`domainScores.${k} 값(${v})이 0~100 범위를 벗어났습니다.`);
  }
  if (r.needsReview) warn("추천 수치 검토 필요 (needsReview)");
  if (r.recommendationReady === false) warn("추천 후보 비활성 (recommendationReady=false)");
  return issues;
}

export interface ImportResult {
  legends: LegendRecord[];
  issues: Issue[];
}

/** 배열 / {legends:[...]} / 단일 객체 모두 허용 */
export function parseLegendImport(text: string, sets: CardSet[]): ImportResult {
  if (text.length > 5_000_000) return { legends: [], issues: [{ level: "error", id: "(JSON)", message: "가져오기 파일은 5MB 이하로 나눠 주세요." }] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { legends: [], issues: [{ level: "error", id: "(JSON)", message: `JSON 형식 오류: ${(e as Error).message}` }] };
  }
  const list = Array.isArray(parsed) ? parsed : isObj(parsed) && Array.isArray(parsed.legends) ? parsed.legends : [parsed];
  const legends: LegendRecord[] = [];
  const issues: Issue[] = [];
  const seen = new Set<string>();
  list.forEach((item, i) => {
    const l = normalizeLegendInput(item);
    if (!l) { issues.push({ level: "error", id: `#${i + 1}`, message: "객체가 아닙니다." }); return; }
    const found = validateLegend(l, sets);
    if (seen.has(l.id)) found.push({ level: "error", id: l.id, message: "같은 id가 파일 안에 두 번 있습니다." });
    seen.add(l.id);
    issues.push(...found);
    if (!found.some((x) => x.level === "error")) legends.push(l);
  });
  return { legends, issues };
}

/** 같은 id는 가져온 쪽으로 교체, 새 id는 추가 */
export function mergeLegends(base: LegendRecord[], incoming: LegendRecord[]): LegendRecord[] {
  const map = new Map(base.map((l) => [l.id, l]));
  for (const l of incoming) map.set(l.id, l);
  return [...map.values()];
}
