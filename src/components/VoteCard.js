// 투표 화면의 선택지 하나 (동그라미 버튼 + 식당 정보)
import { formatPrice } from '../utils/format.js';

export function VoteCard(restaurant) {
  return `
    <label class="vote-card">
      <input type="radio" name="restaurantId" value="${restaurant.id}"
        aria-describedby="restaurantId-error" />
      <span class="vote-card__body">
        <span class="vote-card__name">${restaurant.name}</span>
        <span class="vote-card__meta">
          ⭐ ${restaurant.rating.toFixed(1)} · ${formatPrice(restaurant.pricePerPerson)} · ${restaurant.area}
        </span>
      </span>
    </label>
  `;
}
