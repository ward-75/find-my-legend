"use client";
import { useLanguage, LocaleText } from "@/lib/i18n/react";
import { displayLegendName } from "@/lib/i18n/names";
import { useState } from "react";
import { DOMAIN_META } from "@/lib/labels";
import type { LegendRecord } from "@/lib/types";

/** 실제 카드 이미지. 불러오지 못하면 도메인 색으로 만든 대체 카드를 보여준다. */
export function LegendArt({ legend, className = "", eager = false }: { legend: LegendRecord; className?: string; eager?: boolean }) {
  const { locale } = useLanguage();
  const [failed, setFailed] = useState(false);
  const url = legend.officialData.imageUrl;
  const [a, b] = legend.officialData.domains;
  const ca = DOMAIN_META[a]?.color ?? "#556";
  const cb = DOMAIN_META[b ?? a]?.color ?? ca;
  const alt = `${legend.officialData.champion}, ${legend.officialData.title} 카드`;

  if (!url || failed) {
    return (
      <LocaleText><div
        className={`card-ratio relative flex flex-col justify-end overflow-hidden rounded-[4.5%] border border-white/10 p-[8%] ${className}`}
        style={{ background: `linear-gradient(160deg, ${ca}55, #0e182d 55%, ${cb}55)` }}
        role="img"
        aria-label={alt}
      >
        <span className="font-display text-[clamp(14px,9cqw,40px)] leading-tight text-vellum" style={{ containerType: "inline-size" }}>
          {displayLegendName(legend, locale)}
        </span>
        <span className="mt-1 text-[11px] text-vellum/70">{legend.officialData.title}</span>
      </div></LocaleText>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <LocaleText><img
      src={url}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`card-ratio block h-auto w-full rounded-[4.5%] bg-deeper object-cover shadow-[0_18px_40px_-18px_rgba(0,0,0,0.8)] ${className}`}
    /></LocaleText>
  );
}
