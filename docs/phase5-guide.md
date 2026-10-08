# Phase 5 설명서: 후보 관리와 저장

## 새로 만든 / 바뀐 파일

| 파일 | 하는 일 |
|---|---|
| `src/services/storage.js` | 후보 도우미 함수 추가: `getCurrentGroup`, `getCandidateIds`, `addCandidate`, `removeCandidate` |
| `src/pages/Recommendations.js` | "후보에 추가" 버튼을 저장과 연결, 화면 아래 "담은 후보 N개 · 후보 보기" 바 |
| `src/pages/Candidates.js` | 후보 화면: 목록, 삭제, 투표 만들기 버튼 (2개 이상일 때만 활성) |
| `src/components/CandidateList.js` | 후보 한 줄씩 보여주는 목록 HTML |
| `src/utils/format.js` | `escapeHtml`을 여기로 옮겨서 여러 화면이 같이 써요 |
| `src/main.js` | `/candidates` 주소 추가 |

## 핵심 코드 이해하기

### 1. 후보는 "모임 id + 식당 id" 쌍으로 저장

```js
// LocalStorage의 whatToEat_candidates
[
  { groupId: 'g1728350000000', restaurantId: 'r044' },
  { groupId: 'g1728350000000', restaurantId: 'r020' },
]
```

식당 정보 전체를 저장하지 않고 **id만** 저장해요. 화면에 보여줄 때 `restaurants.find((r) => r.id === id)`로 식당 정보를 찾아와요. 모임마다 후보가 따로 관리돼서, 새 모임을 만들면 후보 목록도 새로 시작해요.

### 2. 화면은 저장소를 직접 만지지 않아요

```js
// Recommendations.js
if (added) removeCandidate(group.id, restaurantId);
else addCandidate(group.id, restaurantId);
```

`localStorage`는 `storage.js` 안에서만 써요 (명세서 10장 규칙). 화면 파일은 "추가해줘 / 삭제해줘"만 부탁하는 거예요.

### 3. 중복 방지 (`some`)

```js
const exists = candidates.some((c) => c.groupId === groupId && c.restaurantId === restaurantId);
if (!exists) saveData(...);
```

`some`은 배열 안에 조건에 맞는 게 **하나라도 있으면 true**예요. 같은 식당이 두 번 들어가지 않게 막아요.

### 4. 삭제 후 화면 다시 그리기

```js
removeCandidate(group.id, button.dataset.removeId);
window.dispatchEvent(new HashChangeEvent('hashchange'));
```

`main.js`는 주소가 바뀔 때(`hashchange`) 화면을 다시 그리죠. 그 신호를 직접 보내서 같은 화면을 새로 그리게 했어요.

### 5. 버튼 비활성화 (`disabled`)

후보가 2개 미만이면 `<button disabled>`가 돼서 눌러지지 않고, 아래에 "후보를 2개 이상 골라주세요." 안내가 나와요.

## 직접 테스트해 보기

1. 추천 화면에서 "+ 후보에 추가"를 몇 개 누르기 → 아래 바의 숫자가 올라가요
2. 같은 버튼을 다시 누르면 취소돼요
3. 새로고침(F5) → 담은 후보가 그대로 남아 있어요
4. "후보 보기" → 목록에서 삭제해 보기, 1개만 남으면 "투표 만들기"가 회색으로 바뀌어요
5. `F12` → Application → Local Storage → `whatToEat_candidates`에서 저장된 내용 확인

투표 만들기 버튼을 누르면 지금은 "다음 단계에서 연결돼요" 안내만 나와요. Phase 6에서 투표 화면과 연결해요.
