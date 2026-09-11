// `npm run preview:build` → preview/dist/index.html 한 파일에 JS·CSS를 모두 인라인
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

export default defineConfig({
  root: import.meta.dirname,
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: { alias: { "@": root } },
  build: { outDir: path.resolve(import.meta.dirname, "dist"), emptyOutDir: true },
});
