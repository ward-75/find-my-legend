import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "나의 Riftbound 전설 찾기 · Find My Legend",
  description: "Riftbound를 처음 보는 사람도 답할 수 있는 14개의 질문으로 플레이 성향을 분석하고, 경험 수준과 카드풀을 고려해 잘 맞는 전설 TOP 5를 추천합니다.",
  openGraph: {
    title: "나와 가장 잘 맞는 Riftbound 전설은?",
    description: "플레이스타일 성향 테스트 + 전설 추천기",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#0b1324", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Hahmlet:wght@500;600;700&family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
