"use client";
import { STYLE_META } from "@/lib/labels";
import { topStyles } from "@/lib/explain";
import type { UserProfile } from "@/lib/types";

/** 사용자 스타일 TOP N 막대 */
export function StyleChart({ profile, n = 6 }: { profile: UserProfile; n?: number }) {
  const rows = topStyles(profile, n);
  return (
    <ol className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.key} className="grid grid-cols-[1.2rem_6.5rem_1fr_2.2rem] items-center gap-3">
          <span className="font-display text-sm text-haze">{i + 1}</span>
          <span className="text-[15px]">{STYLE_META[r.key].label}</span>
          <span className="bar-track h-2 overflow-hidden rounded-full">
            <span
              className="block h-full rounded-full bg-vellum transition-[width] duration-700"
              style={{ width: `${r.value}%`, opacity: 1 - i * 0.09 }}
            />
          </span>
          <span className="text-right font-display tabular-nums">{r.value}</span>
        </li>
      ))}
    </ol>
  );
}
