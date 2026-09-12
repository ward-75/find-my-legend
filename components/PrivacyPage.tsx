"use client";
import Link from "next/link";
import { LanguageProvider, LanguageSelector, LocaleText, useLanguage } from "@/lib/i18n/react";

function PrivacyContent() {
  const { locale } = useLanguage();
  return <LocaleText><div className="min-h-svh">
    <header className="border-b border-rim">
      <nav className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4">
        <Link href={`/?lang=${locale}`} className="font-display text-lg">Find My Legend</Link>
        <LanguageSelector />
      </nav>
    </header>
    <main className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-3xl">개인정보처리방침</h1>
      <p className="mt-2 text-sm text-haze">최종 업데이트: 2026-09-12</p>
        <h2 className="mt-8 font-display text-xl">서비스와 데이터 처리</h2>
        <p className="mt-3 leading-7 text-vellum/80">Find My Legend는 회원가입이나 로그인 없이 사용하는 정적 웹앱입니다. 답변과 추천 계산은 브라우저에서 처리하며, 앱 자체의 서버나 데이터베이스에 계정·답변·추천 결과를 저장하는 기능은 없습니다.</p>
        <h2 className="mt-8 font-display text-xl">브라우저 저장소</h2>
        <p className="mt-3 leading-7 text-vellum/80">직접 선택한 언어는 localStorage의 find-my-legend.language.v1에 저장합니다. 데이터 관리에서 가져온 전설 데이터와 수정값은 find-my-legend.imported.v1에 저장합니다. 이 정보는 별도의 자동 만료 없이 해당 브라우저에 남으며, 앱이 서버로 업로드하지 않습니다. 브라우저의 사이트 데이터 삭제로 지울 수 있고, 가져온 데이터는 데이터 관리 화면에서도 초기화할 수 있습니다.</p>
        <p className="mt-3 leading-7 text-vellum/80">진행 중인 답변은 localStorage에 저장하지 않습니다. 첫 방문에는 브라우저 언어를 읽어 표시 언어를 정하며, 언어 감지가 실패하면 한국어를 사용합니다.</p>
        <h2 className="mt-8 font-display text-xl">결과와 공유 URL</h2>
        <p className="mt-3 leading-7 text-vellum/80">결과 URL의 r 값에는 질문 버전, 답변, 경험 수준, 선택한 세트, 세트 포함 방식과 보조 세트 포함 여부가 인코딩됩니다. lang 값은 표시 언어입니다. 이는 암호화가 아니므로 링크를 가진 사람은 답변과 결과를 복원할 수 있습니다. URL은 브라우저 기록에 남거나 링크를 여는 호스팅 서비스의 요청 로그에 포함될 수 있으므로 공개를 원하지 않는 결과 링크는 공유하지 마세요.</p>
        <p className="mt-3 leading-7 text-vellum/80">공유 이미지는 브라우저에서 생성합니다. 링크 복사, 이미지 저장 또는 기기의 공유 기능은 사용자가 해당 버튼을 누를 때 실행됩니다. 앱이 결과를 별도의 공유 서버에 자동 업로드하지 않습니다.</p>
        <h2 className="mt-8 font-display text-xl">호스팅과 외부 리소스</h2>
        <p className="mt-3 leading-7 text-vellum/80">사이트는 GitHub Pages에서 제공됩니다. 글꼴은 Google Fonts의 fonts.googleapis.com 및 fonts.gstatic.com에서, 기본 카드 이미지는 Riot Games의 cmsassets.rgpub.io에서 불러옵니다. 가져온 카드 데이터에 다른 HTTPS 이미지 주소가 있으면 그 주소로 요청할 수 있습니다. 외부 링크를 클릭하면 해당 사이트로 이동합니다.</p>
        <p className="mt-3 leading-7 text-vellum/80">이러한 요청을 받는 제공업체는 통신에 필요한 IP 주소, 요청 시각, 브라우저 정보 등의 접속 정보를 처리할 수 있으며 각자의 정책이 적용됩니다. 앱 운영자가 외부 제공업체의 로그 보관 기간이나 처리를 통제하지 않습니다.</p>
        <h2 className="mt-8 font-display text-xl">쿠키와 분석·광고</h2>
        <p className="mt-3 leading-7 text-vellum/80">현재 앱 코드에는 쿠키를 직접 설정하거나 읽는 기능, Analytics 또는 AdSense 같은 방문 분석·광고 기능이 없습니다. localStorage는 쿠키와 별개의 브라우저 저장소입니다. 외부 제공업체의 데이터 처리는 해당 업체의 정책을 따릅니다.</p>
        <h2 className="mt-8 font-display text-xl">문의</h2>
        <p className="mt-3 leading-7 text-vellum/80">개인정보 관련 문의는 프로젝트 저장소의 Issues를 이용할 수 있습니다. Issues는 공개되므로 비밀번호, 토큰 또는 비공개로 유지할 결과 링크를 게시하지 마세요.</p>
      <a className="mt-3 inline-block text-brass underline" href="https://github.com/ward-75/find-my-legend/issues" rel="noreferrer">프로젝트 문의 (공개 Issues)</a>
      <p className="mt-10"><Link className="text-brass underline" href={`/?lang=${locale}`}>처음으로</Link></p>
    </main>
  </div></LocaleText>;
}
export default function PrivacyPage() {
  return <LanguageProvider><PrivacyContent /></LanguageProvider>;
}
