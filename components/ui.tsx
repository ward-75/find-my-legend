"use client";
import { LocaleText } from "@/lib/i18n/react";
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { DOMAIN_META } from "@/lib/labels";
import type { DomainKey } from "@/lib/types";

type Variant = "primary" | "ghost" | "quiet";

export function Button({ variant = "ghost", className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const v =
    variant === "primary"
      ? "bg-vellum text-abyss hover:bg-white"
      : variant === "ghost"
        ? "border border-rim text-vellum hover:border-haze hover:bg-white/5"
        : "text-haze hover:text-vellum underline-offset-4 hover:underline px-2";
  return <LocaleText><button type="button" className={`${base} ${v} ${className}`} {...rest} /></LocaleText>;
}

export function DomainBadge({ domain, size = "md" }: { domain: DomainKey; size?: "sm" | "md" }) {
  const m = DOMAIN_META[domain];
  return (
    <LocaleText><span
      className={`inline-flex items-center gap-1.5 rounded-full border ${size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-[13px]"}`}
      style={{ borderColor: m.color + "66", background: m.tint, color: m.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} aria-hidden />
      {m.label}
    </span></LocaleText>
  );
}

export function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: "plain" | "warn" }) {
  return (
    <LocaleText><span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ${
        tone === "warn" ? "border border-brass/50 text-brass" : "bg-white/[0.06] text-haze"
      }`}
    >
      {children}
    </span></LocaleText>
  );
}

export function Difficulty({ value }: { value: number }) {
  return (
    <LocaleText><span className="inline-flex items-center gap-1" aria-label={`난이도 ${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`h-2 w-2 rotate-45 ${i <= value ? "bg-vellum" : "border border-rim"}`} aria-hidden />
      ))}
    </span></LocaleText>
  );
}

/** 모달 시트: Esc/배경 클릭으로 닫기, 열릴 때 포커스 이동, 스크롤 잠금 */
export function Sheet({ open, onClose, title, children, wide = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <LocaleText><div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="anim-fade absolute inset-0 bg-[#050a14]/80 backdrop-blur-sm" onClick={onClose} />
      <div
        ref={ref}
        tabIndex={-1}
        className={`anim-sheet relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-rim bg-deep outline-none sm:rounded-2xl ${wide ? "sm:max-w-4xl" : "sm:max-w-2xl"}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-rim bg-deep/95 px-5 py-3 backdrop-blur">
          <h2 className="font-display text-lg">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-haze hover:text-vellum" aria-label="닫기">
            닫기
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div></LocaleText>
  );
}

/** 0~100 막대 */
export function Bar({ value, color = "var(--color-vellum)", label }: { value: number; color?: string; label?: string }) {
  return (
    <LocaleText><div className="bar-track h-1.5 w-full overflow-hidden rounded-full" role="img" aria-label={label ?? `${Math.round(value)}`}>
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: color }} />
    </div></LocaleText>
  );
}
