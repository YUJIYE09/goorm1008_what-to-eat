# Phase 3 설명서: 식당 데이터와 카드

## 새로 만든 / 바뀐 파일

| 파일 | 하는 일 |
|---|---|
| `src/data/restaurants.js` | 가상의 샘플 식당 28곳 (7개 지역 × 4곳) |
| `src/services/recommendation.js` | 조건에 맞는 식당만 거르는 `filterRestaurants` |
| `src/components/RestaurantCard.js` | 식당 카드 하나의 HTML |
| `src/pages/Recommendations.js` | 조건 요약 + 카드 목록, 결과가 없을 때 안내 화면 |
| `src/main.js` | 추천 화면에 버튼 이벤트 연결(`mountRecommendations`) 추가 |
| `src/styles/components.css`, `responsive.css` | 카드 스타일, 태블릿 이상에서 2열 배치 |

## 핵심 코드 이해하기

### 1. 데이터는 "객체의 배열"

```js
export const restaurants = [
  { id: 'r001', name: '홍대 고기집', area: '홍대', pricePerPerson: 28000, ... },
  { id: 'r002', name: '연남 한식당', ... },
];
```

식당 하나 = 객체 `{ }` 하나, 그걸 배열 `[ ]`에 모아둔 거예요. 식당을 추가하고 싶으면 같은 모양으로 한 줄 더 쓰면 돼요.

### 2. `filter`로 거르기 (`recommendation.js`)

```js
return restaurants.filter((restaurant) => {
  const fitsBudget = restaurant.pricePerPerson <= group.budget; // 예산 이하
  const fitsPeople = restaurant.capacity >= group.people;       // 인원 수용 가능
  return fitsBudget && fitsPeople; // 둘 다 true인 식당만 남아요
});
```

`filter`는 배열을 하나씩 검사해서 `true`를 돌려준 것만 모아 새 배열을 만들어요.

### 3. `map`으로 카드 여러 개 만들기 (`Recommendations.js`)

```js
results.map((r) => RestaurantCard(r)).join('')
```

`map`은 식당 하나하나를 카드 HTML로 바꾸고, `join('')`으로 하나의 긴 HTML로 이어 붙여요.

### 4. 사진 대신 이모지

실제 사진이 없어서 `image`가 비어 있으면 음식 종류 이모지와 배경색으로 자리를 채웠어요. 나중에 `public/images/`에 사진을 넣고 `image: '/images/파일이름.jpg'`로 적으면 사진이 대신 나와요.

### 5. 결과가 없을 때

조건에 맞는 식당이 0곳이면 빈 화면 대신 "아직 조건에 맞는 식당을 찾지 못했어요." 안내와 "조건 다시 설정" 버튼을 보여줘요.

## 지금 단계의 한계 (다음 단계에서 해결)

- **정렬:** 지금은 데이터 순서대로 보여줘서 다른 지역 식당도 섞여 나와요. Phase 4에서 지역·음식·분위기 일치 점수를 계산해 높은 순으로 정렬해요.
- **후보에 추가:** 버튼 모양만 바뀌고 저장되지 않아요. Phase 5에서 후보 목록 저장과 연결해요.
