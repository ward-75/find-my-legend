#!/usr/bin/env node
// 새 세트의 Legend 공식 데이터 초안을 Riftcodex API에서 받아 가져오기용 JSON을 만든다.
//   npm run data:fetch -- --set=RAD            → data/import-RAD.json
//   npm run data:fetch -- --set=RAD --out=x.json
// 결과물의 recommendationData는 비워 두고 needsReview=true, recommendationReady=false로 표시한다(점수는 가져오기 시 50으로 채워짐).
// 데이터 관리 화면의 [Legend JSON 가져오기]로 검사/적용하거나, 검토 후 legends.json에 병합하세요.
import { writeFile } from "node:fs/promises";

const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const SET = (args.set || "").toUpperCase();
if (!SET) {
  console.error("사용법: npm run data:fetch -- --set=<세트코드> [--set-id=<sets.json id>] [--out=<파일>]");
  process.exit(1);
}
const setId = args["set-id"] || SET.toLowerCase();
const out = args.out || `data/import-${SET}.json`;
const API = "https://api.riftcodex.com";

async function getJson(url) {
  const res = await fetch(url, { headers: { "user-agent": "find-my-legend-data-script" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

const slug = (s) => s.replace(/'/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const unescape = (s) => s.replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");

const cards = [];
for (let page = 1; ; page++) {
  const d = await getJson(`${API}/cards?page=${page}&size=100`);
  cards.push(...d.items);
  if (page >= d.pages) break;
}

// 기본 인쇄본만: Legend 타입, 해당 세트, 오버넘버/시그니처/대체 아트 제외.
// metadata 플래그가 빠진 오버넘버도 있으므로 "번호 ≤ 세트 총수"(ogn-255-298의 255 ≤ 298)로 한 번 더 거른다.
const inBase = (id) => {
  const [, n, total] = id.split("-");
  return parseInt(n, 10) <= parseInt(total, 10);
};
const base = cards.filter((c) =>
  c.classification?.type === "Legend" && c.set?.set_id === SET && inBase(c.riftbound_id) &&
  !c.metadata?.overnumbered && !c.metadata?.signature && !c.metadata?.alternate_art);

const seen = new Map();
for (const c of base) {
  const prev = seen.get(c.riftbound_id);
  if (!prev || (!prev.name.includes(" - ") && c.name.includes(" - "))) seen.set(c.riftbound_id, c);
}

const legends = [...seen.values()].map((c) => {
  const [champion, title] = c.name.includes(" - ") ? c.name.split(" - ").map((s) => s.trim()) : [null, c.name];
  const num = String(parseInt(c.riftbound_id.split("-")[1], 10)).padStart(3, "0");
  const domains = (c.classification.domain || []).map((d) => d.toLowerCase());
  return {
    id: champion ? `${slug(champion)}-${slug(title)}-${SET.toLowerCase()}` : `TODO-${c.riftbound_id}`,
    officialData: {
      champion: champion ?? "TODO",
      title,
      setId,
      setCode: SET,
      collectorNumber: `${SET}-${num}`,
      riftboundId: c.riftbound_id,
      domains,
      abilityText: c.text?.plain ? unescape(c.text.plain) : null,
      imageUrl: c.media?.image_url ?? null,
      artist: c.media?.artist ?? null,
      sourceUrls: [`${API}/cards/riftbound/${c.riftbound_id}`],
      verifiedAt: new Date().toISOString().slice(0, 10),
      ...(!champion
        ? { dataNote: `API 이름 필드에 챔피언이 없음: "${c.name}". 다른 출처로 확인 필요.` }
        : champion.includes(",")
          ? { dataNote: `API 챔피언 표기가 "${champion}"입니다. 태그가 섞였을 수 있으니 다른 출처로 확인 필요.` }
          : {}),
    },
    localization: { championKo: null, titleKo: null },
    recommendationData: { recommendationReady: false, needsReview: true, reviewNote: "Riftcodex 초안. 추천 수치 미작성. 검토 후 recommendationReady=true로 전환." },
  };
});

await writeFile(out, JSON.stringify(legends, null, 2) + "\n");
console.log(`${SET}: 기본 인쇄 Legend ${legends.length}장 → ${out}`);
const todo = legends.filter((l) => l.officialData.dataNote);
if (todo.length) console.log(`챔피언명을 확인해야 하는 카드 ${todo.length}장: ${todo.map((l) => l.officialData.riftboundId).join(", ")}`);
