"use client";
import { useEffect, useRef, useState } from "react";
import { QUESTIONS } from "@/lib/data";
import type { Answers, ExperienceLevel } from "@/lib/types";
import { ProgressBar } from "./ProgressBar";
import { QuestionCard } from "./QuestionCard";
import { Button } from "./ui";

const ADVANCE_MS = 320;

export function Quiz({ answers, index, onAnswer, onIndex, onFinish, onExit, experience }: {
  answers: Answers;
  index: number;
  onAnswer: (i: number, v: number) => void;
  onIndex: (i: number) => void;
  onFinish: () => void;
  onExit: () => void;
  experience: ExperienceLevel;
}) {
  const [dir, setDir] = useState<1 | -1>(1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const q = QUESTIONS[index];
  const last = index === QUESTIONS.length - 1;
  const allDone = answers.every((a) => a !== null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const go = (i: number) => {
    if (timer.current) clearTimeout(timer.current);
    setDir(i > index ? 1 : -1);
    onIndex(i);
  };

  const answer = (v: number) => {
    onAnswer(index, v);
    if (!last) {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { setDir(1); onIndex(index + 1); }, ADVANCE_MS);
    }
  };

  const firstUnanswered = answers.findIndex((a) => a === null);

  return (
    <section className="mx-auto flex min-h-[calc(100svh-64px)] max-w-2xl flex-col px-5 pb-10 pt-6 sm:min-h-0 sm:pb-16">
      <ProgressBar index={index} answers={answers} />
      <div className="mt-10 flex-1 sm:flex-none">
        <QuestionCard question={q} value={answers[index]} onAnswer={answer} direction={dir} experience={experience} />
      </div>
      <nav className="mt-10 flex sm:mt-14 items-center justify-between gap-3" aria-label="문항 이동">
        {index === 0 ? (
          <Button variant="quiet" onClick={onExit} className="-ml-2">설정 다시 고르기</Button>
        ) : (
          <Button variant="ghost" onClick={() => go(index - 1)}>이전 질문</Button>
        )}
        {last ? (
          <Button variant="primary" disabled={!allDone} onClick={onFinish}>
            {allDone ? "결과 보기" : `${firstUnanswered + 1}번 문항이 비어 있어요`}
          </Button>
        ) : (
          <Button variant="ghost" disabled={answers[index] === null} onClick={() => go(index + 1)}>다음 질문</Button>
        )}
      </nav>
      {last && !allDone && firstUnanswered >= 0 && (
        <p className="mt-3 text-right text-sm">
          <button type="button" className="text-haze underline underline-offset-4 hover:text-vellum" onClick={() => go(firstUnanswered)}>
            빈 문항으로 이동
          </button>
        </p>
      )}
    </section>
  );
}
