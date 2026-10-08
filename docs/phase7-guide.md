# Phase 7 설명서: 투표 결과

## 새로 만든 / 바뀐 파일

| 파일 | 하는 일 |
|---|---|
| `src/pages/Results.js` | 결과 화면: 1위 안내, 식당별 득표 막대, 투표한 사람 이름, 공동 1위 처리 |
| `src/pages/Vote.js` | 투표 화면과 투표 완료 안내에 "결과 보기" 링크 추가 |
| `src/main.js` | `/results` 주소 추가 (`#/results?id=v123`) |
| `src/styles/components.css` | 1위 박스, 막대 그래프 스타일 |

## 핵심 코드 이해하기

### 1. 집계: 식당마다 표 세기 (`tallyVotes`)

```js
const voters = responses
  .filter((response) => response.restaurantId === restaurant.id) // 이 식당을 고른 응답만
  .map((response) => response.voterName);                           // 이름만 뽑기
return { restaurant, count: voters.length, voters };
```

0표인 후보도 빠지지 않도록 "응답"이 아니라 "후보 목록"을 기준으로 돌면서 세요.

### 2. 순위: 표 많은 순 정렬

```js
rows.sort((a, b) => b.count - a.count);
```

Phase 4의 점수 정렬과 같은 방식이에요.

### 3. 공동 1위 찾기

```js
const topCount = rows[0]?.count ?? 0;                 // 가장 많은 표 수
const winners = rows.filter((row) => row.count === topCount && topCount > 0);
```

- `winners`가 1개 → "🏆 현재 1위" (마감 후에는 "최종 1위")
- 2개 이상 → "🏆 공동 1위입니다!"
- 아무도 투표 안 했으면 → "아직 투표한 사람이 없어요."

`?.`와 `??`는 후보가 없을 때 오류 대신 0을 쓰게 해주는 안전장치예요.

### 4. 막대 그래프는 CSS만으로

```js
const width = Math.round((row.count / topCount) * 100); // 1위를 100%로
`<div class="result__bar" style="width: ${width}%"></div>`
```

회색 바탕(`result__track`) 위에 주황 막대의 너비만 바꿔요. Chart.js 같은 라이브러리 없이도 충분해요. 화면낭독기를 위해 막대에 "OO 3표, 전체 5표 중" 설명(`aria-label`)을 붙였어요.

## 이제 전체 흐름이 완성됐어요 (명세서 21장)

모임 생성 → 조건 입력 → 식당 추천 → 후보 3개 선택 → 투표 생성 → 투표 → 결과 확인

## 직접 테스트해 보기

1. 투표 화면에서 "결과 보기" → 아직 아무도 안 했으면 "아직 투표한 사람이 없어요."
2. 두 식당에 같은 수로 투표 → "🏆 공동 1위입니다!"
3. 한 표 더 → "🏆 현재 1위 OO"와 주소
4. 새로고침해도 결과 유지
