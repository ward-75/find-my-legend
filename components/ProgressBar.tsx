"use client";
import type { Answers } from "@/lib/types";

/** 문항 수만큼 나뉜 진행 막대: 답한 칸은 채움, 현재 칸은 밝은 테두리 */
export function ProgressBar({ index, answers }: { index: number; answers: Answers }) {
  const total = answers.length;
  const done = answers.filter((a) => a !== null).length;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-haze">
          <span className="font-display text-lg text-vellum">{index + 1}</span> / {total}
        </span>
        <span className="text-haze">{done}개 답함</span>
      </div>
      <div className="mt-2 flex gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="진행률">
        {answers.map((a, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
              i === index ? "bg-vellum/90" : a !== null ? "bg-vellum/55" : "bg-white/10"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
