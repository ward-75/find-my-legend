import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ward-75.github.io/find-my-legend/"),
  title: "Find My Legend · 나의 Riftbound 전설 찾기",
  description: "14개의 질문으로 나의 플레이스타일을 알아보고, 경험 수준과 카드풀에 맞는 Riftbound 전설 TOP 5를 만나보세요.",
  openGraph: {
    title: "Find My Legend · 나의 Riftbound 전설 찾기",
    description: "14개의 질문으로 나의 플레이스타일을 알아보고, 경험 수준과 카드풀에 맞는 Riftbound 전설 TOP 5를 만나보세요.",
    type: "website",
    url: "https://ward-75.github.io/find-my-legend/",
    siteName: "Find My Legend",
    images: [{
      url: "https://ward-75.github.io/find-my-legend/og-image.png",
      width: 1731,
      height: 909,
      alt: "Find My Legend — Discover your Riftbound Legend",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Find My Legend · 나의 Riftbound 전설 찾기",
    description: "14개의 질문으로 나의 플레이스타일을 알아보고, 경험 수준과 카드풀에 맞는 Riftbound 전설 TOP 5를 만나보세요.",
    images: [{
      url: "https://ward-75.github.io/find-my-legend/og-image.png",
      alt: "Find My Legend — Discover your Riftbound Legend",
    }],
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
