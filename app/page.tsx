"use client";
// 백엔드 없는 정적 앱: 모든 화면은 클라이언트에서 URL(?view=, ?r=)로 전환된다.
// App 자체가 client component이므로 Next dynamic(ssr:false) 없이 직접 렌더링한다.
import App from "@/components/App";

export default function Page() {
  return <App />;
}
