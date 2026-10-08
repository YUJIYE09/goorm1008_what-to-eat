# Phase 6 설명서: 투표 만들기와 투표하기

## 새로 만든 / 바뀐 파일

| 파일 | 하는 일 |
|---|---|
| `src/pages/Candidates.js` | "투표 만들기" → 제목·마감 시간 폼 → 완료 안내(투표 페이지 보기 / 링크 복사) |
| `src/pages/Vote.js` | 투표 화면: 후보 고르기, 이름 입력, 검증, 투표 완료, 마감 처리 |
| `src/components/VoteCard.js` | 투표 선택지 하나 (동그라미 버튼 + 식당 정보) |
| `src/services/storage.js` | `createVote`, `getVote`, `getResponses`, `saveResponse` 추가 |
| `src/utils/validation.js` | `validateVote`(제목·마감), `validateVoteResponse`(이름·식당) 추가 |
| `src/utils/format.js` | 날짜 입력칸 형식 `toDateTimeLocal`, 마감 시간 표시 `formatDeadline` 추가 |
| `src/main.js` | `/vote` 주소 추가, `#/vote?id=v123`처럼 주소 뒤의 값을 읽도록 변경 |
| `src/styles/reset.css` | `hidden` 속성이 확실히 숨겨지도록 규칙 추가 |

## 핵심 코드 이해하기

### 1. 주소에 값 담기 (`main.js`)

```js
// "#/vote?id=v123" → path "/vote", params { id: 'v123' }
const [path, query = ''] = (window.location.hash.slice(1) || '/').split('?');
const params = Object.fromEntries(new URLSearchParams(query));
route.view(params);
```

`?` 뒤의 값으로 "어떤 투표"인지 알려줘요. 그래서 링크 하나로 특정 투표 화면을 열 수 있어요.

### 2. 한 사람당 한 표 (`saveResponse`)

```js
const others = responses.filter((r) => !(r.voteId === voteId && r.voterName === voterName));
saveData(STORAGE_KEYS.responses, [...others, { voteId, voterName, restaurantId }]);
```

같은 이름의 예전 응답을 빼고 새 응답을 넣어요. 같은 이름으로 다시 투표하면 "이전 선택을 바꿔서 ~에 투표했어요"라고 알려줘요.

### 3. 마감 시간 비교

```js
new Date(vote.deadline) <= new Date() // true면 마감
```

마감이 지나면 선택지, 이름 칸, 투표 버튼이 모두 잠기고 "마감된 투표예요" 안내가 나와요.

### 4. `hidden` 속성과 CSS

`<form hidden>`처럼 `hidden`을 붙이면 숨겨져야 하는데, CSS에서 `display: flex`를 주면 다시 보여요. 그래서 `reset.css`에 `[hidden] { display: none !important; }`를 넣어 항상 숨겨지게 했어요.

### 5. 링크 복사 (`navigator.clipboard`)

```js
await navigator.clipboard.writeText(url);
```

브라우저 클립보드에 글자를 넣는 기능이에요. 쓸 수 없는 환경이면 링크를 화면에 대신 보여줘요.

## 알아둘 점 (MVP의 한계)

- 데이터가 **내 브라우저(LocalStorage)에만** 저장돼서, 복사한 링크를 친구에게 보내도 친구 휴대폰에서는 투표가 보이지 않아요. 명세서대로 서버 기반 공유는 Version 0.2(Supabase)에서 해요.
- 지금은 한 기기에서 "다른 사람도 투표하기"로 돌아가며 투표하는 방식이에요.

## 직접 테스트해 보기

1. 후보 2개 이상 → "투표 만들기" → 기본 제목 "[모임 이름] 식당 투표", 마감 시간은 오늘 23:59
2. 제목을 지우고 시작 → "투표 제목을 입력해주세요."
3. "투표 페이지 보기" → 아무것도 고르지 않고 투표 → "식당을 하나 선택해주세요." / "이름을 입력해주세요."
4. 투표 → "OO님, 투표 완료!" → "다른 사람도 투표하기"로 여러 명 투표
5. 같은 이름으로 다시 투표 → 선택이 바뀌고 인원수는 그대로
