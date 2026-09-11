// 결과 공유: 답변 자체를 짧은 문자열로 인코딩해 URL 한 줄로 동일 결과를 재현한다.
// q2부터 경험 수준을 함께 저장한다.
// 형식: <질문버전>.<세트id>.<c|o>.<1|0>.<n|s|e>.<답변열>
import type { Answers, CutoffMode, ExperienceLevel, Question } from "./types";

export interface SharedState {
  questionVersion: string;
  cutoff: string;
  mode: CutoffMode;
  includeSupplemental: boolean;
  experience: ExperienceLevel;
  answers: Answers;
}

const EXP_CODE: Record<ExperienceLevel, string> = { new: "n", some: "s", experienced: "e" };
const CODE_EXP: Record<string, ExperienceLevel> = { n: "new", s: "some", e: "experienced" };

export function encodeState(s: SharedState): string {
  const ans = s.answers.map((a) => (a === null || a === undefined ? "-" : String(a))).join("");
  return [s.questionVersion, s.cutoff, s.mode === "only" ? "o" : "c", s.includeSupplemental ? "1" : "0", EXP_CODE[s.experience], ans].join(".");
}

export function decodeState(code: string, questions: Question[], expectedVersion: string): SharedState | null {
  const parts = code.split(".");
  if (parts.length !== 6) return null;
  const [v, cutoff, m, sup, expCode, ans] = parts;
  if (v !== expectedVersion) return null;
  if (!['c', 'o'].includes(m) || !['0', '1'].includes(sup)) return null;
  if (!/^[a-z0-9-]+$/.test(cutoff)) return null;
  const experience = Object.hasOwn(CODE_EXP, expCode) ? CODE_EXP[expCode] : undefined;
  if (!experience) return null;
  if (ans.length !== questions.length) return null;
  const answers: Answers = [];
  for (let i = 0; i < ans.length; i++) {
    const ch = ans[i];
    if (ch === "-") { answers.push(null); continue; }
    if (!/^[0-9]$/.test(ch)) return null;
    const n = Number(ch);
    const q = questions[i];
    const ok = q.type === "choice" ? n >= 0 && n < q.options.length : n >= 1 && n <= 5;
    if (!Number.isInteger(n) || !ok) return null;
    answers.push(n);
  }
  return { questionVersion: v, cutoff, mode: m === "o" ? "only" : "cumulative", includeSupplemental: sup !== "0", experience, answers };
}
