"use client";
import { useLanguage, LocaleText } from "@/lib/i18n/react";
import { useEffect, useRef, useState } from "react";
import { displayLegendName } from "@/lib/i18n/names";
import { translate } from "@/lib/i18n/translate";
import type { Locale } from "@/lib/i18n/core";
import { DOMAIN_META, STYLE_META } from "@/lib/labels";
import { topDomains, topStyles } from "@/lib/explain";
import type { LegendMatch, Persona, UserProfile } from "@/lib/types";
import { Button } from "./ui";

const W = 1080, H = 1350;

async function drawShareImage(canvas: HTMLCanvasElement, persona: Persona, profile: UserProfile, top: LegendMatch, locale: Locale) {
  const t = (text: string) => translate(text, locale);
  try { await document.fonts?.ready; } catch { /* 폰트 API가 없는 환경 */ }
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const l = top.legend;
  const [da, db] = l.officialData.domains;
  const ca = DOMAIN_META[da].color, cb = DOMAIN_META[db ?? da].color;
  const serif = `"Hahmlet", "Noto Serif KR", serif`;
  const sans = `"IBM Plex Sans KR", "Apple SD Gothic Neo", sans-serif`;

  ctx.fillStyle = "#0b1324"; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, 420, 40, W / 2, 420, 620);
  g.addColorStop(0, ca + "66"); g.addColorStop(0.55, cb + "22"); g.addColorStop(1, "#0b132400");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(200,161,90,0.55)"; ctx.lineWidth = 3; ctx.strokeRect(40, 40, W - 80, H - 80);

  ctx.textAlign = "center"; ctx.fillStyle = "#8f9cb9";
  ctx.font = `500 38px ${sans}`; ctx.fillText(t("나의 Riftbound 전설"), W / 2, 150, W - 160);
  ctx.fillStyle = "#ece4d0"; ctx.font = `600 64px ${serif}`; ctx.fillText(t(persona.name), W / 2, 240, W - 160);

  ctx.font = `600 150px ${serif}`; ctx.fillText(displayLegendName(l, locale), W / 2, 520, W - 160);
  ctx.fillStyle = "#c9d0e0"; ctx.font = `400 42px ${sans}`;
  ctx.fillText(`${l.officialData.champion}, ${l.officialData.title}`, W / 2, 600, W - 160);

  ctx.fillStyle = "#ece4d0"; ctx.font = `600 190px ${serif}`; ctx.fillText(t(`${top.score}점`), W / 2, 840, W - 160);
  ctx.fillStyle = "#8f9cb9"; ctx.font = `400 36px ${sans}`; ctx.fillText(t("추천 점수"), W / 2, 895, W - 160);

  const stats = [
    ...topDomains(profile, 2).map((d) => ({ label: DOMAIN_META[d.key].label, v: d.value, c: DOMAIN_META[d.key].color })),
    ...topStyles(profile, 1).map((s) => ({ label: STYLE_META[s.key].label, v: s.value, c: "#ece4d0" })),
  ];
  const colW = (W - 200) / 3;
  stats.forEach((s, i) => {
    const x = 100 + colW * i + colW / 2;
    ctx.fillStyle = s.c; ctx.font = `600 44px ${sans}`; ctx.fillText(t(s.label), x, 1030, colW - 20);
    ctx.fillStyle = "#ece4d0"; ctx.font = `600 72px ${serif}`; ctx.fillText(String(Math.round(s.v)), x, 1115);
  });

  ctx.fillStyle = "#8f9cb9"; ctx.font = `400 34px ${sans}`;
  ctx.fillText("#FindMyLegend  #Riftbound", W / 2, 1245);
}

function copyFallback(text: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}

/** 결과 이미지 카드 + 링크 복사 */
export function ShareCard({ persona, profile, top, url }: { persona: Persona; profile: UserProfile; top: LegendMatch; url: string }) {
  const { locale, t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    let alive = true;
    drawShareImage(c, persona, profile, top, locale).then(() => { if (alive) setPreview(c.toDataURL("image/png")); });
    return () => { alive = false; };
  }, [persona, profile, top, locale]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setMsg("링크를 복사했습니다."); }
    catch { setMsg(copyFallback(url) ? "링크를 복사했습니다." : "복사가 막힌 환경입니다. 아래 링크를 직접 복사해 주세요."); }
  };

  const save = () => {
    const c = canvasRef.current;
    if (!c) return;
    c.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "my-riftbound-legend.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        try { await nav.share({ files: [file], title: t("나의 Riftbound 전설"), url }); return; } catch { /* 사용자가 취소 */ }
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = file.name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      setMsg("이미지를 저장했습니다.");
    }, "image/png");
  };

  return (
    <LocaleText><section className="grid gap-6 rounded-2xl border border-rim bg-deep/60 p-5 sm:grid-cols-[220px_1fr] sm:p-7" aria-labelledby="share-title">
      <canvas ref={canvasRef} width={W} height={H} className="hidden" />
      <div className="mx-auto w-[200px] sm:w-full">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={`공유 이미지: ${persona.name}, ${displayLegendName(top.legend, locale)} ${top.score}점`} className="w-full rounded-lg border border-rim" />
        ) : (
          <div className="aspect-[4/5] w-full rounded-lg border border-rim bg-deeper" />
        )}
      </div>
      <div className="min-w-0">
        <h2 id="share-title" className="font-display text-2xl">결과 공유하기</h2>
        <p className="mt-2 text-vellum/75">링크를 받은 사람은 같은 답변과 같은 카드풀로 똑같은 결과를 보게 됩니다.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="primary" onClick={copy}>링크 복사</Button>
          <Button onClick={save}>이미지 저장</Button>
        </div>
        <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} aria-label="공유 링크"
          className="mt-4 w-full rounded-lg border border-rim bg-deeper px-3 py-2 text-sm text-haze" />
        <p className="mt-2 min-h-5 text-sm text-calm" role="status">{msg}</p>
      </div>
    </section></LocaleText>
  );
}
