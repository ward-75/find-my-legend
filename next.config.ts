import type { NextConfig } from "next";

// 정적 export: `npm run build` → out/ 폴더를 GitHub Pages, Netlify 등 아무 정적 호스팅에 올리면 된다.
// 하위 경로에 배포할 때는 BASE_PATH=/find-my-legend npm run build
const basePath = process.env.BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
