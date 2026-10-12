// 샘플 식당 추천 로직 (카카오 실제 식당이 연결되지 않았을 때 사용)
// 1) 점수 계산하기 (scoreRestaurant)
// 2) 점수 높은 순으로 정렬하기 (recommendRestaurants)
import { groupCategories } from '../utils/format.js';

// 점수표 (최대 100점)
// v0.7: 인원수·예산 칸을 없애서 지역·음식·분위기·평점으로만 계산해요
export const SCORE_RULES = {
  area: 35, // 지역 일치
  category: 30, // 음식 종류 일치
  atmosphere: 20, // 분위기 일치
  rating: 15, // 평점 4.5 이상
};

// 식당 하나의 점수와 "왜 그 점수인지(matches)"를 계산해요
export function scoreRestaurant(restaurant, group) {
  const matches = {
    area: restaurant.area === group.area,
    category: groupCategories(group).includes(restaurant.category), // 고른 종류 중 하나면 일치
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

// 점수 붙이고 → 높은 순 정렬
export function recommendRestaurants(restaurants, group) {
  return restaurants
    .map((restaurant) => ({ ...restaurant, ...scoreRestaurant(restaurant, group) }))
    .sort((a, b) => b.score - a.score || b.rating - a.rating); // 점수가 같으면 평점 높은 순
}
