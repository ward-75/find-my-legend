"use client";
import { LocaleText } from "@/lib/i18n/react";
import { DOMAIN_KEYS } from "@/lib/types";
import { DOMAIN_META } from "@/lib/labels";
import { QUESTIONS } from "@/lib/data";
import { useLegendStore } from "./store";
import { LegendArt } from "./LegendArt";
import { Button } from "./ui";

const FAN = ["ahri-nine-tailed-fox-ogn", "jinx-loose-cannon-ogn", "viktor-herald-of-the-arcane-ogn", "yasuo-unforgiven-ogn", "sett-the-boss-ogn"];
// 부채꼴 배치: 가운데 카드가 가장 앞
const FAN_POSE = [
  { r: -16, x: -118, y: 34, z: 1 },
  { r: -8, x: -60, y: 10, z: 2 },
  { r: 0, x: 0, y: 0, z: 3 },
  { r: 8, x: 60, y: 10, z: 2 },
  { r: 16, x: 118, y: 34, z: 1 },
];

export function Landing({ onStart, onBrowse }: { onStart: () => void; onBrowse: () => void }) {
  const { legends } = useLegendStore();
  const fan = FAN.map((id) => legends.find((l) => l.id === id)).filter((l): l is NonNullable<typeof l> => !!l);
  const minutes = Math.max(2, Math.round(QUESTIONS.length * 0.22));

  return (
    <LocaleText><section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 md:grid-cols-[1.25fr_1fr] md:pt-20">
      <div>
        <p className="text-haze">Riftbound 플레이스타일 테스트</p>
        <h1 className="mt-3 font-display text-[clamp(34px,5.4vw,58px)] font-semibold leading-[1.15] tracking-[-0.01em]">
          나와 가장 잘 맞는
          <br />
          Riftbound 전설은?
        </h1>
        <p className="mt-5 max-w-[34ch] text-[17px] text-vellum/80">
          Riftbound를 처음 보는 사람도 답할 수 있는 {QUESTIONS.length}개의 질문으로 플레이 성향을 읽고, 경험 수준과 선택한 카드풀까지 고려해 잘 맞는 전설 다섯을 찾아 드립니다.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button variant="primary" className="px-7 py-3 text-base" onClick={onStart}>
            테스트 시작
          </Button>
          <Button onClick={onBrowse}>모든 전설 보기</Button>
        </div>
        <p className="mt-4 text-sm text-haze">
          약 {minutes}분 · {QUESTIONS.length}문항 · 완전 입문자 지원 · 로그인 없음
        </p>
      </div>

      <div className="relative mx-auto h-[330px] w-full max-w-[460px] sm:h-[400px]" aria-hidden>
        {fan.map((l, i) => {
          const p = FAN_POSE[i];
          return (
            <div
              key={l.id}
              className="absolute left-1/2 top-2 w-[150px] sm:w-[190px]"
              style={{ transform: `translateX(calc(-50% + ${p.x}px)) translateY(${p.y}px) rotate(${p.r}deg)`, zIndex: p.z }}
            >
              {/* 위치(transform)와 등장 애니메이션을 다른 요소에 둬야 서로 덮어쓰지 않는다 */}
              <div className="anim-rise" style={{ animationDelay: `${120 + Math.abs(i - 2) * 90}ms` }}>
                <LegendArt legend={l} eager />
              </div>
            </div>
          );
        })}
      </div>

      <div className="md:col-span-2">
        <h2 className="font-display text-xl">여섯 도메인은 여섯 가지 플레이 성향입니다</h2>
        <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
          {DOMAIN_KEYS.map((d) => (
            <li key={d} className="border-l-2 pl-3" style={{ borderColor: DOMAIN_META[d].color }}>
              <p className="font-medium" style={{ color: DOMAIN_META[d].color }}>{DOMAIN_META[d].label}</p>
              <p className="text-sm text-haze">{DOMAIN_META[d].gist}</p>
            </li>
          ))}
        </ul>
      </div>
    </section></LocaleText>
  );
}
