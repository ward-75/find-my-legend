# 확장팩 / Legend 업데이트 가이드

## 1. 세트만 미리 등록

`data/sets.json`에 새 세트를 추가한다.

필수: `id`, `name`, `koreanName`, `code`, `order`, `releaseDate`, `isSupplemental`.

`releaseDate`가 `YYYY-MM-DD`이면 사이트가 그 날짜부터 자동으로 출시 세트로 취급한다. 코드에서 `released`를 다시 바꿀 필요는 없다. 날짜는 방문자 기기의 현지 날짜를 기준으로 하며, 열린 탭도 자정·화면 복귀 시 갱신된다. 실제 지역별 출시일은 운영자가 확인해 입력한다.

## 2. 공식 Legend 데이터 초안 받기

```bash
npm run data:fetch -- --set=RAD --set-id=radiance
```

초안은 `recommendationReady: false`로 시작한다. 따라서 전설 목록/관리 데이터에는 둘 수 있지만 성향 테스트 추천 후보에는 아직 들어가지 않는다.

## 3. 추천 수치 검토

개발용 직접 주소 `?view=data`에서 JSON을 가져오고 `recommendationData`를 검토한다.

검토 완료 시:

```json
{
  "recommendationReady": true,
  "needsReview": false
}
```

로 바꾼다.

## 4. 배포

검토한 `data/legends.json`과 `data/sets.json`을 GitHub 저장소 `main`에 push한다.
`.github/workflows/pages.yml`이 테스트/타입체크/정적 빌드 후 GitHub Pages에 자동 배포한다.

즉, 일반적인 새 확장팩 추가는 앱 컴포넌트를 수정하지 않고 **세트 JSON + 전설 JSON**만 갱신하는 것을 목표로 한다.


## 데이터 상태 주의사항

- `recommendationReady: false`는 가져오기·편집·새로고침 후에도 보존된다.
- 스타일 점수, 도메인 점수, 난이도가 미완성이면 가져오기 시 추천 준비 상태가 비활성화된다. 검토 후 전체 값을 입력하고 `recommendationReady: true`로 설정한다.
- 미출시 세트는 추천과 일반 목록의 출시 카드풀에 포함되지 않는다. 출시된 세트의 준비 중 전설은 목록에 표시되며 추천 후보에서는 제외된다.
- `?view=data`의 변경은 해당 브라우저에만 저장된다. 모든 방문자에게 반영하려면 JSON을 내려받아 저장소의 파일을 갱신하고 다시 배포해야 한다.
- 공유 링크에는 답변·경험·세트 범위가 저장된다. 추후 추천 데이터가 바뀌거나 브라우저에 별도 데이터를 가져왔다면 같은 링크의 결과도 달라질 수 있다.
