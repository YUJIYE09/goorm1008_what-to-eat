# Phase 8 설명서: 마무리 다듬기

## 새로 만든 / 바뀐 파일

| 파일 | 하는 일 |
|---|---|
| `src/main.js` | 오류가 나도 빈 화면 대신 오류 안내, 없는 주소 안내, 브라우저 탭 제목, 화면 이동 시 제목으로 포커스 이동, "본문으로 건너뛰기" 링크 |
| `src/pages/Fallback.js` | "페이지를 찾을 수 없어요", "문제가 생겼어요" 화면 |
| `index.html` | JavaScript가 준비되기 전 로딩 화면, JavaScript가 꺼져 있을 때 안내, 탭 아이콘 🍽️ |
| `src/services/storage.js` | 저장된 데이터가 깨져 있어도 앱이 멈추지 않도록 확인, `addGroup` 추가 |
| `src/pages/CreateGroup.js` | 모임 저장을 `addGroup`으로 변경 |
| `src/styles/global.css` | 건너뛰기 링크, 애니메이션 줄이기 설정 존중 |
| `src/styles/responsive.css` | 360px 미만 작은 휴대폰 대응, 1024px 이상에서 카드 3열 |
| `src/data/restaurants.js` | 지역 × 음식 조합마다 3곳씩, 총 149곳 |

## 핵심 코드 이해하기

### 1. 오류가 나도 빈 화면은 없게 (`try...catch`)

```js
try {
  paint(route.view(params), route.title);
  route.mount?.(params);
} catch (error) {
  console.error('화면을 그리다 오류가 났어요:', error);
  paint(ErrorPage(), '문제가 생겼어요');
}
```

`try` 안에서 오류가 나면 앱이 멈추는 대신 `catch`로 넘어가 안내 화면을 보여줘요.

### 2. 깨진 데이터 막기 (`getList`)

```js
function getList(key) {
  const data = getData(key, []);
  return Array.isArray(data) ? data : [];
}
```

LocalStorage는 사용자가 직접 지우거나 고칠 수도 있어요. 목록이어야 할 값이 목록이 아니면 빈 목록으로 처리하고, 모임·투표에 필요한 값이 빠져 있으면 "없는 것"으로 처리해서 안내 화면을 보여줘요.

### 3. 로딩 화면은 `index.html`에

```html
<div id="app">
  <div class="loading" role="status">… 불러오는 중…</div>
</div>
```

JavaScript가 도착하기 전까지 보이고, `main.js`가 `#app` 내용을 바꾸는 순간 자연스럽게 사라져요. 이 앱은 데이터를 서버에서 받지 않아서 화면 전환은 즉시라 별도 로딩이 필요 없어요. 실제 식당 API를 붙이면(Version 0.3) 그때 "식당 찾는 중…"을 추가하면 돼요.

### 4. 접근성 점검 (명세서 13장)

| 항목 | 적용 |
|---|---|
| 모든 input에 label | ✅ `<label for>` 연결, 라디오는 `<fieldset>`+`<legend>` |
| 이미지 alt | ✅ 이모지 이미지에 `role="img"`와 `aria-label` |
| 명확한 버튼 텍스트 | ✅ "삭제" 버튼에 "OO 후보에서 삭제" 설명 |
| 색상 대비 | ✅ 흰 글씨 버튼·1위 박스는 진한 주황 사용 |
| 키보드 접근 | ✅ Tab 이동, 방향키로 라디오 선택, "본문으로 건너뛰기" |
| focus 상태 | ✅ 파란 테두리(`:focus-visible`), 화면 이동 시 새 제목으로 포커스 |
| 오류 메시지 읽어주기 | ✅ `aria-live`, `aria-invalid`, `aria-describedby` |

### 5. 화면 크기별 점검

320px(작은 휴대폰), 768px(태블릿), 1280px(PC)에서 모든 화면을 열어 **가로 스크롤이 생기지 않는지**, **버튼·입력칸 높이가 44px 이상인지** 자동으로 확인했어요.

## 명세서 21장 완료 기준

| 기준 | 상태 |
|---|---|
| 모임 생성 → 추천 → 후보 3개 → 투표 생성 → 투표 → 결과 | ✅ |
| 모바일 사용 가능 | ✅ |
| 새로고침 후 데이터 유지 | ✅ |
| 주요 기능에 치명적 오류 없음 | ✅ |
| GitHub 업로드 가능 | ✅ `.gitignore` 준비됨 (저장소 연결 필요) |
| Vercel 배포 가능 | ✅ `npm run build` 성공 (저장소 연결 후 배포) |
