// 식당 추천 로직
// 1) 조건에 안 맞는 식당 거르기 (filterRestaurants)
// 2) 점수 계산하기 (scoreRestaurant)
// 3) 점수 높은 순으로 정렬하기 (recommendRestaurants)

// 명세서 8.1 점수표 (최대 100점)
export const SCORE_RULES = {
  area: 30, // 지역 일치
  category: 25, // 음식 종류 일치
  budget: 20, // 예산 적합
  atmosphere: 15, // 분위기 일치
  rating: 10, // 평점 4.5 이상
};

// 모임 조건(group)에 맞는 식당만 남겨요
export function filterRestaurants(restaurants, group) {
  return restaurants.filter((restaurant) => {
    // 1인 가격이 예산 이하인지 (예산 초과 식당은 제외)
    const fitsBudget = restaurant.pricePerPerson <= group.budget;
    // 모임 인원이 다 앉을 수 있는지
    const fitsPeople = restaurant.capacity >= group.people;
    return fitsBudget && fitsPeople;
  });
}

// 식당 하나의 점수와 "왜 그 점수인지(matches)"를 계산해요
export function scoreRestaurant(restaurant, group) {
  const matches = {
    area: restaurant.area === group.area,
    category: restaurant.category === group.category,
    budget: restaurant.pricePerPerson <= group.budget,
    atmosphere: restaurant.atmosphere === group.atmosphere,
    rating: restaurant.rating >= 4.5,
  };

  // 맞은 항목의 점수만 더해요
  let score = 0;
  for (const key in matches) {
    if (matches[key]) score += SCORE_RULES[key];
  }

  return { score, matches };
}

// 거르고 → 점수 붙이고 → 높은 순 정렬
export function recommendRestaurants(restaurants, group) {
  return filterRestaurants(restaurants, group)
    .map((restaurant) => ({ ...restaurant, ...scoreRestaurant(restaurant, group) }))
    .sort((a, b) => b.score - a.score || b.rating - a.rating); // 점수가 같으면 평점 높은 순
}
