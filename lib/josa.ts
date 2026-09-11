// 한국어 조사 선택: 마지막 글자의 받침 유무로 은/는, 이/가, 과/와, 을/를 을 고른다.
function hasBatchim(word: string): boolean | null {
  const trimmed = word.trim();
  if (!trimmed) return null;
  const ch = trimmed.charCodeAt(trimmed.length - 1);
  if (ch >= 0xac00 && ch <= 0xd7a3) return (ch - 0xac00) % 28 !== 0;
  // 영문/숫자 등: 판단 불가
  return null;
}

type Pair = "은/는" | "이/가" | "과/와" | "을/를" | "으로/로";

export function josa(word: string, pair: Pair): string {
  const b = hasBatchim(word);
  const [withB, without] = pair.split("/");
  if (b === null) return `${word}${withB}(${without})`;
  if (pair === "으로/로") {
    const code = word.charCodeAt(word.length - 1);
    const isRieul = (code - 0xac00) % 28 === 8;
    return word + (b && !isRieul ? withB : without);
  }
  return word + (b ? withB : without);
}
