// 식당 카드 하나의 HTML을 만들어요
import {
  formatPrice,
  formatDistance,
  escapeHtml,
  safePlaceUrl,
  CATEGORY_LABELS,
} from '../utils/format.js';

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
  // 카카오에서 찾은 실제 식당은 따로 그려요
  if (String(restaurant.id).startsWith('k')) return PlaceCard(restaurant, { isCandidate });

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
        ${CandidateButton(id, isCandidate)}
      </div>
    </article>
  `;
}

// "후보에 추가" 버튼
function CandidateButton(id, isCandidate) {
  return `
    <button type="button" class="btn ${isCandidate ? 'btn--done' : 'btn--secondary'} card__action"
      data-candidate-id="${escapeHtml(id)}" aria-pressed="${isCandidate}">
      ${isCandidate ? '✓ 후보에 추가됨' : '+ 후보에 추가'}
    </button>
  `;
}

// 실제 식당 카드 (v0.3)
// 카카오 검색은 평점·가격·영업시간을 주지 않아서, 카카오맵 상세 페이지 링크로 확인하게 해요
function PlaceCard(place, { isCandidate }) {
  const name = escapeHtml(place.name);
  const placeUrl = safePlaceUrl(place.placeUrl);

  return `
    <article class="card">
      <div class="card__image card__image--compact card__image--${place.category}" role="img"
        aria-label="${CATEGORY_LABELS[place.category] ?? '식당'}">${CATEGORY_EMOJI[place.category] ?? '🍽️'}</div>
      <div class="card__body">
        <div class="card__head">
          <h2 class="card__title">${name}</h2>
          ${place.distance ? `<span class="card__distance">${formatDistance(place.distance)}</span>` : ''}
        </div>
        ${place.categoryName ? `<ul class="tag-list"><li class="tag">${escapeHtml(place.categoryName)}</li></ul>` : ''}
        <ul class="card__meta card__meta--place">
          <li><span aria-hidden="true">📍</span> ${escapeHtml(place.address)}</li>
          ${place.phone ? `<li><span aria-hidden="true">📞</span> <a class="link" href="tel:${escapeHtml(place.phone)}">${escapeHtml(place.phone)}</a></li>` : ''}
        </ul>
        ${
          placeUrl
            ? `<a class="link card__link" href="${placeUrl}" target="_blank" rel="noopener noreferrer">
                 카카오맵에서 평점·메뉴·영업시간 보기<span class="visually-hidden"> (${name}, 새 창)</span> ↗
               </a>`
            : ''
        }
        ${CandidateButton(place.id, isCandidate)}
      </div>
    </article>
  `;
}
