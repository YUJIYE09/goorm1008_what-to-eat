# Phase 4 설명서: 추천 점수와 정렬

## 바뀐 파일

| 파일 | 하는 일 |
|---|---|
| `src/services/recommendation.js` | 점수 계산 `scoreRestaurant`, 정렬까지 하는 `recommendRestaurants` 추가 |
| `src/components/RestaurantCard.js` | 점수 배지(예: 100점)와 "지역/음식/분위기 일치" 태그 표시 |
| `src/pages/Recommendations.js` | 거르기 대신 `recommendRestaurants` 사용 |
| `src/data/restaurants.js` | 식당 23곳 추가 → 총 51곳. 모든 지역에 7가지 음식 종류가 다 있어요 |
| `src/styles/components.css` | 점수 배지, 태그 스타일 |

## 핵심 코드 이해하기

### 1. 점수표를 객체로 (`SCORE_RULES`)

```js
export const SCORE_RULES = {
  area: 30, category: 25, budget: 20, atmosphere: 15, rating: 10,
};
```

점수를 바꾸고 싶으면 이 숫자만 고치면 돼요.

### 2. "맞았는지"를 먼저 정리하고, 맞은 것만 더하기

```js
const matches = {
  area: restaurant.area === group.area,         // true 또는 false
  category: restaurant.category === group.category,
  ...
};
for (const key in matches) {
  if (matches[key]) score += SCORE_RULES[key];
}
```

`matches`는 카드에 "📍 지역 일치" 태그를 붙일 때도 다시 사용해요. 한 번 계산해서 두 곳에 쓰는 거예요.

### 3. 거르기 → 점수 → 정렬 한 줄로 잇기

```js
return filterRestaurants(restaurants, group)
  .map((r) => ({ ...r, ...scoreRestaurant(r, group) }))
  .sort((a, b) => b.score - a.score || b.rating - a.rating);
```

- `{ ...r, ...점수 }`: 식당 정보에 `score`, `matches`를 덧붙인 새 객체를 만들어요. (`...`은 "펼쳐 넣기")
- `sort((a, b) => b.score - a.score)`: 결과가 양수면 b를 앞으로 → **큰 점수가 먼저** 와요.
- `|| b.rating - a.rating`: 점수가 같으면(0) 평점 높은 순으로 한 번 더 정렬해요.

## 참고

- 예산 초과 식당은 아예 걸러지기 때문에, 화면에 나온 식당은 모두 "예산 적합 +20점"을 받아요.
- 지역·음식이 달라도 목록에서 빠지지는 않고 점수만 낮아져요. 딱 맞는 식당이 없어도 비슷한 곳을 보여주기 위한 명세서 규칙이에요.

## 추가: 지역별로 나눠 보여주기

선택한 지역 식당은 "📍 OO 추천", 나머지는 "🚶 다른 지역 추천" 섹션으로 나눠서 보여줘요. 각 섹션 안에서는 점수 높은 순이에요.

```js
const sameArea = results.filter((r) => r.matches.area);   // 지역 일치
const otherArea = results.filter((r) => !r.matches.area); // 그 외
```
