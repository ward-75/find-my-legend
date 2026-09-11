// 단일 HTML 미리보기 빌드 진입점 (Next.js 없이 같은 컴포넌트를 그대로 사용)
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/components/App";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
