// 식당 카드 하나의 HTML을 만들어요
import { formatPrice, CATEGORY_LABELS } from '../utils/format.js';

// 실제 사진이 없어서 음식 종류 이모지로 이미지 자리를 채워요
const CATEGORY_EMOJI = {
  korean: '🍚',
  japanese: '🍣',
  chinese: '🥟',
  western: '🍝',
  meat: '🥩',
  chicken: '🍗',
  cafe: '☕',
};

// 점수가 왜 나왔는지 보여줄 태그 이름
const MATCH_LABELS = {
  area: '📍 지역',
  category: '🍴 음식',
  atmosphere: '✨ 분위기',
};

export function RestaurantCard(restaurant, { isCandidate = false } = {}) {
  const { id, name, area, category, pricePerPerson, rating, capacity, description, image } =
    restaurant;
  const { score, matches } = restaurant; // 추천 점수 (없으면 표시 안 함)

  const scoreBadge =
    score === undefined ? '' : `<span class="card__score">${score}<small>점</small></span>`;

  // 지역·음식·분위기 중 일치한 항목만 태그로 보여줘요
  const matchTags = matches
    ? Object.keys(MATCH_LABELS)
        .filter((key) => matches[key])
        .map((key) => `<li class="tag">${MATCH_LABELS[key]} 일치</li>`)
        .join('')
    : '';

  const visual = image
    ? `<img class="card__image" src="${image}" alt="${name} 사진" />`
    : `<div class="card__image card__image--${category}" role="img"
         aria-label="${CATEGORY_LABELS[category]} 식당">${CATEGORY_EMOJI[category]}</div>`;

  return `
    <article class="card">
      ${visual}
      <div class="card__body">
        <div class="card__head">
          <h2 class="card__title">${name}</h2>
          ${scoreBadge}
        </div>
        ${matchTags ? `<ul class="tag-list" aria-label="일치한 조건">${matchTags}</ul>` : ''}
        <p class="card__desc">${description}</p>
        <ul class="card__meta">
          <li><span aria-hidden="true">⭐</span> ${rating.toFixed(1)}</li>
          <li>1인 약 ${formatPrice(pricePerPerson)}</li>
          <li><span aria-hidden="true">🚶</span> ${area}</li>
          <li><span aria-hidden="true">👥</span> 최대 ${capacity}명</li>
        </ul>
        <button type="button" class="btn ${isCandidate ? 'btn--done' : 'btn--secondary'} card__action"
          data-candidate-id="${id}" aria-pressed="${isCandidate}">
          ${isCandidate ? '✓ 후보에 추가됨' : '+ 후보에 추가'}
        </button>
      </div>
    </article>
  `;
}
