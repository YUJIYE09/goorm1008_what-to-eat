# Phase 2 설명서: 모임 만들기

## 새로 만든 / 바뀐 파일

| 파일 | 하는 일 |
|---|---|
| `src/pages/CreateGroup.js` | 모임 만들기 화면. 제출하면 검사 → 저장 → 추천 화면으로 이동 |
| `src/components/FilterForm.js` | 입력 폼 HTML (이름, 지역, 인원, 예산, 음식 종류, 분위기) |
| `src/utils/validation.js` | 입력값 검사 규칙 (이름 1~30자, 인원 1~100명, 예산 1,000~1,000,000원, 필수 선택) |
| `src/utils/format.js` | 지역·음식·분위기 목록과 한글 이름, `30000 → 30,000원` 변환 |
| `src/services/storage.js` | LocalStorage 저장/불러오기 (`saveData`, `getData`, `removeData`, `clearData`) |
| `src/pages/Recommendations.js` | 입력한 조건을 보여주는 임시 추천 화면 (식당 목록은 Phase 3) |
| `src/main.js` | `/create`, `/recommendations` 주소 추가 |
| `src/styles/components.css` | 폼, 칩 버튼, 오류 메시지 스타일 추가 |

> storage.js는 원래 Phase 5 항목이지만, 입력한 모임 정보를 추천 화면으로 넘기려면 지금 필요해서 기본 함수만 먼저 만들었어요.

## 핵심 코드 이해하기

### 1. 화면을 그린 "다음에" 이벤트 연결하기 (`main.js`)

```js
const routes = {
  '/create': { view: CreateGroup, mount: mountCreateGroup },
};
app.innerHTML = route.view();  // 1) HTML을 먼저 그리고
route.mount?.();               // 2) 그 다음 버튼·폼에 이벤트를 붙여요
```

HTML이 화면에 있어야 `document.querySelector('#group-form')`로 찾을 수 있기 때문에 순서가 중요해요.

### 2. 제출 처리 (`CreateGroup.js`)

```js
form.addEventListener('submit', (event) => {
  event.preventDefault();           // 브라우저 기본 동작(새로고침) 막기
  const formData = new FormData(form); // 폼 값 한 번에 모으기
  const errors = validateGroup(values);
  if (Object.keys(errors).length > 0) return; // 오류 있으면 멈춤
  saveData(STORAGE_KEYS.groups, [...groups, group]); // 저장
  window.location.hash = '/recommendations';          // 화면 이동
});
```

### 3. 검사 결과를 "오류 목록"으로 돌려주기 (`validation.js`)

```js
validateGroup(values)
// → {}  이면 통과
// → { people: '인원은 1~100명 사이로 입력해주세요.' } 이면 해당 칸 아래에 표시
```

검사 규칙과 화면 표시를 나눠두면, 규칙만 고치고 싶을 때 이 파일만 보면 돼요.

### 4. LocalStorage (`storage.js`)

LocalStorage는 브라우저 안의 작은 저장 공간이에요. 글자만 저장할 수 있어서 `JSON.stringify`로 글자로 바꿔 저장하고, `JSON.parse`로 다시 데이터로 바꿔 꺼내요. 그래서 **새로고침해도 모임 정보가 남아 있어요.**

확인 방법: 브라우저에서 `F12` → Application 탭 → Local Storage → `whatToEat_groups`

### 5. 칩 모양 선택 버튼

진짜 `<input type="radio">`는 눈에 안 보이게 숨기고, 옆의 `<span>`을 버튼처럼 꾸몄어요. 선택되면 `input:checked + span` 스타일이 적용돼요. 숨겨도 radio가 그대로 있어서 키보드(Tab, 방향키)로도 고를 수 있어요.

## 직접 테스트해 보기

1. 아무것도 입력하지 않고 "식당 추천 받기" → 모든 칸에 오류 메시지가 뜨고 첫 칸으로 이동
2. 인원에 150 입력 → "인원은 1~100명 사이로 입력해주세요."
3. 모두 올바르게 입력 → 추천 화면에 `홍대 · 6명 · 30,000원`처럼 조건 표시
4. 추천 화면에서 새로고침(F5) → 내용이 그대로 유지
