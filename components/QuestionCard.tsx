"use client";
import { LocaleText } from "@/lib/i18n/react";
import type { ExperienceLevel, Question } from "@/lib/types";

const SCALE_SIZE = ["h-11 w-11", "h-9 w-9", "h-7 w-7", "h-9 w-9", "h-11 w-11"];
const SCALE_LABEL = ["왼쪽에 매우 가깝다", "왼쪽에 조금 가깝다", "중간", "오른쪽에 조금 가깝다", "오른쪽에 매우 가깝다"];

export function QuestionCard({ question, value, onAnswer, direction, experience }: {
  question: Question;
  value: number | null;
  onAnswer: (v: number) => void;
  direction: 1 | -1;
  experience: ExperienceLevel;
}) {
  const beginner = experience === "new";
  const prompt = beginner ? (question.beginnerPrompt ?? question.prompt) : question.prompt;

  return (
    <LocaleText><div key={`${question.id}-${beginner ? "beginner" : "standard"}`} className={direction === 1 ? "anim-q" : "anim-q-back"}>
      <h2 className="font-display text-[clamp(22px,4.2vw,32px)] font-semibold leading-snug">{prompt}</h2>
      {beginner && <p className="mt-2 text-sm text-haze">Riftbound 용어를 몰라도 느낌대로 고르면 됩니다.</p>}

      {question.type === "choice" ? (
        <div role="radiogroup" aria-label={prompt} className="mt-7 space-y-2.5">
          {question.options.map((o, i) => {
            const on = value === i;
            const label = beginner ? (o.beginnerLabel ?? o.label) : o.label;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => onAnswer(i)}
                className={`group flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left text-[16px] transition-colors ${
                  on ? "border-vellum bg-white/[0.08]" : "border-rim hover:border-haze hover:bg-white/[0.03]"
                }`}
              >
                <span
                  aria-hidden
                  className={`h-3 w-3 shrink-0 rotate-45 border transition-colors ${on ? "border-vellum bg-vellum" : "border-haze group-hover:border-vellum"}`}
                />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-9">
          <div className="grid grid-cols-2 gap-4 text-[15px]">
            <p className="text-vellum/85">{beginner ? (question.beginnerLeftLabel ?? question.leftLabel) : question.leftLabel}</p>
            <p className="text-right text-vellum/85">{beginner ? (question.beginnerRightLabel ?? question.rightLabel) : question.rightLabel}</p>
          </div>
          <div role="radiogroup" aria-label={prompt} className="mt-5 flex items-center justify-between gap-2 px-1">
            {[1, 2, 3, 4, 5].map((v, i) => {
              const on = value === v;
              return (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  aria-label={SCALE_LABEL[i]}
                  onClick={() => onAnswer(v)}
                  className="flex h-12 w-12 items-center justify-center"
                >
                  <span
                    className={`${SCALE_SIZE[i]} rounded-full border-2 transition-all ${
                      on ? "scale-110 border-vellum bg-vellum" : "border-haze/70 hover:border-vellum hover:bg-white/10"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div></LocaleText>
  );
}
