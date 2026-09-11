# 나의 Riftbound 전설 찾기 (Find My Legend)

14개 질문으로 플레이 성향을 수치화하고, Riftbound 경험 수준과 선택한 카드풀을 함께 고려해 잘 맞는 전설(Legend) TOP 5를 추천하는 정적 웹앱입니다. 완전 입문자는 게임 용어를 몰라도 답할 수 있는 쉬운 문구를 사용합니다. 백엔드 없이 로컬 JSON만 사용합니다.

## 실행

```bash
npm ci
npm run dev            # http://localhost:3000
npm run build          # 정적 export → out/ (아무 정적 호스팅에 업로드)
npm run test           # 단위·통합 테스트 47개 (카드풀 cutoff, 점수, 추천, 공유, 데이터 무결성)
npm run typecheck
npm run validate:data  # data/*.json 무결성만 검사
npm run preview:build  # preview/dist/index.html 단일 파일 빌드 (설치 없이 열어 보기용)
npm run data:fetch -- --set=RAD --set-id=radiance   # 새 세트 Legend 공식 데이터 초안 받기
```

하위 경로 배포(GitHub Pages 등): `BASE_PATH=/find-my-legend npm run build`

스택: Next.js 16 (App Router, `output: "export"`), React 19, TypeScript 5.9, Tailwind CSS 4, Recharts 3, Vitest.

## 구조

```
app/            layout.tsx, page.tsx(클라이언트 앱 진입), globals.css(디자인 토큰)
components/     App(화면 상태 머신 + URL 동기화), Landing, SetSelector, Quiz, QuestionCard,
                ProgressBar, Results, DomainRadar, StyleChart, LegendResultCard(1위/2~5위),
                WhyMatch, LegendCompare, LegendBrowser, LegendDetail, ShareCard, DataAdmin,
                AbilityText, LegendArt, store(가져온 데이터 보관), ui
lib/            types, data(JSON → 타입), setFilter(카드풀), scoring(답변 → 성향),
                recommendation(적합도), explain(추천 이유 문장 조립), persona(별칭),
                share(결과 URL 인코딩), validate(JSON 가져오기/검증), format(능력 텍스트 아이콘), josa, labels
data/           sets.json, legends.json, questions.json, personas.json
scripts/        fetch-riftcodex.mjs
tests/          Vitest
preview/        같은 컴포넌트로 만드는 단일 HTML 미리보기(Vite)
```

화면은 한 페이지 안에서 URL로 전환됩니다: `?view=start`(세트 선택), `?view=test`, `?view=legends`, `?view=data`, 결과는 `?r=<코드>`. 정적 호스팅만으로 공유 링크가 동작하게 하기 위한 선택입니다.

## 카드 데이터 원칙

`legends.json`의 각 전설은 두 부분으로 나뉩니다.

- `officialData`: 실제 카드 정보. 챔피언, 타이틀, 세트, 카드 번호, 도메인, 능력 원문, 이미지 URL, 일러스트레이터, 출처 URL, 확인일. **Riftcodex API의 기본 인쇄본**(오버넘버, 시그니처, 대체 아트 제외)에서 가져왔고, 이름은 riftdecks.com 전설 목록과 대조했습니다. 도메인 분포(Body 17, Order 17, 나머지 16)도 riftdecks 집계와 일치합니다.
- `recommendationData`: 서비스 자체 평가값. 난이도, 아키타입, 22개 스타일 점수, 도메인 점수, 설명, 강점/약점. 능력 원문과 도메인을 근거로 한 1차 평가이며, 전부 `needsReview: true` 상태입니다.

현재 수록: Origins 12 + Proving Grounds 4(보조 세트) + Spiritforged 12 + Unleashed 12 + Vendetta 9 = 49장. 첨부 데이터에는 Radiance 전설이 없으며, 해당 세트의 출시 여부는 `releaseDate`로 판정합니다.

보정 기록: `ven-155-166`은 API 이름 필드가 "Yordle, Kennen"으로 되어 있어 riftdecks 표기(Kennen, Heart of the Tempest)를 따르고 `dataNote`에 남겼습니다. 한국어 챔피언명은 LoL 한국 클라이언트 표기이며, 전설 타이틀의 한국어 공식 번역은 확인하지 못해 `titleKo: null`입니다.

## 새 확장팩 추가

상세 절차: `docs/UPDATE_GUIDE.md`


1. `data/sets.json`에 세트 한 줄 추가 (`order`, `releaseDate`, `released`, `isSupplemental`). 보조 세트는 부모와 같은 `order`.
2. `npm run data:fetch -- --set=<코드> --set-id=<id>` → `data/import-<코드>.json` 초안 생성. 챔피언명이 이상한 카드는 경고가 뜹니다.
3. 앱의 **데이터** 화면에서 가져오기 → 검사 → 적용. 누락된 점수는 50으로 채우고 검토 필요로 표시됩니다.
4. 수치를 조정한 뒤 `legends.json 내려받기`로 받은 파일을 `data/`에 덮어쓰고 `npm run validate:data`.

세트에 `releaseDate`가 등록되어 있으면 해당 날짜부터 "최신 세트까지" 선택지에 자동으로 반영됩니다. 새 전설의 공식 데이터는 `data:fetch` → 검토 → `legends.json` 반영 순서로 추가하며, `recommendationReady: false`인 동안에는 전설 목록에는 남아도 성향 테스트 추천 후보에서는 제외할 수 있습니다.

## 추천 알고리즘

**성향 계산** (`lib/scoring.ts`): 각 답변에 숨겨진 가중치(`domain.calm`, `style.control` 등)를 합산하고, 각 차원을 "이 질문지로 가능한 최소~최대" 범위로 0~100 정규화합니다. 가능 범위가 작은 차원(한두 문항에서만 측정되는 차원)은 50 쪽으로 수축시켜 극단값을 막습니다. 척도형 문항은 1~5 선택값에 따라 양쪽 가중치를 선형 보간합니다.

**적합도** (`lib/recommendation.ts`):

| 비중 | 항목 | 계산 |
|---|---|---|
| 40% | 스타일 유사도 | 22차원 가중 거리(사용자가 강하게 원하는 차원일수록 비중 큼) 50% + 상관계수 50% |
| 30% | 도메인 유사도 | 6차원 같은 방식 (상관계수 60%) |
| 15% | 난이도 | 운영 난도 선호 → 선호 난이도 1~5와 전설 난이도 차이 |
| 10% | 주도/대응 | (공격성+템포) − (컨트롤+상호작용) 지표 차이 |
| 5% | 안정/고점 | 고점 추구 − 안정성 지표 차이 |

표시값은 확률(%)이 아니라 1~99의 **추천 점수**입니다. 절대 적합도 60% + 후보군 안의 상대 위치 40%를 섞어 (`SCORE_CURVE`) 점수가 상단에 몰리지 않게 합니다. 완전 입문자/기본 경험 사용자는 고난도 전설에 작은 소프트 패널티가 추가되며, 전설 자체를 후보에서 제거하지는 않습니다.

**추천 이유**: 사용자와 전설 모두 60점 이상인 차원 → "잘 맞는 이유", 28점 이상 벌어진 차원 → "주의할 점". TOP 5 안에서 같은 주의 문구는 반복하지 않고, 겹치면 전설 고유 약점(데이터)으로 대체합니다. 문장은 `lib/labels.ts`의 차원별 문구와 실제 점수 차이로 조립하며 생성형 문장은 쓰지 않습니다.

## 튜닝 포인트

- 질문/가중치: `data/questions.json` (바꾸면 `version`을 올려야 기존 공유 링크가 깨지지 않고 "읽을 수 없음"으로 안내됨)
- 별칭: `data/personas.json`
- 비중·표시 곡선: `lib/recommendation.ts`의 `MATCH_WEIGHTS`, `SCORE_CURVE`
- 입문 난이도 보정: `lib/experience.ts`의 `experienceDifficultyPenalty`
- 수축 강도: `lib/scoring.ts`의 `EVIDENCE_FULL_RANGE`
- 성향별 기대 결과는 `tests/recommendation.test.ts`에 고정되어 있어, 튜닝 후 `npm test`로 회귀를 확인할 수 있습니다.

## 고지

카드 이미지는 Riot Games 서버의 원본 URL을 직접 불러오며, 불러오지 못하면 도메인 색 대체 카드를 표시합니다. 이 프로젝트는 Riot Games의 "Legal Jibber Jabber" 정책에 따른 팬 프로젝트이며 Riot Games가 보증하거나 후원하지 않습니다.

## GitHub Pages 배포

`.github/workflows/pages.yml`이 포함되어 있습니다. GitHub 저장소의 **Settings → Pages → Source**를 `GitHub Actions`로 설정한 뒤 `main`에 push하면 자동 빌드·배포됩니다. 저장소가 `find-my-legend`라면 주소는 보통 `https://<아이디>.github.io/find-my-legend/` 형태입니다.


Node.js 22 이상을 사용합니다. 배포 workflow는 `configure-pages`가 반환한 `base_path`를 사용하므로 일반 저장소 하위 경로와 사용자/조직 기본 도메인을 구분합니다. `public/.nojekyll`은 정적 산출물에도 포함됩니다.

공식 배포 설정 참고: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

2026-09-11 검증 범위와 변경 내역은 `docs/RELEASE_CHECK.md`에 기록했습니다.
