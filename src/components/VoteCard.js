// 투표 화면의 선택지 하나 (동그라미 버튼 + 식당 정보)
import { escapeHtml, restaurantMeta } from '../utils/format.js';

export function VoteCard(restaurant) {
  return `
    <label class="vote-card">
      <input type="radio" name="restaurantId" value="${escapeHtml(restaurant.id)}"
        aria-describedby="restaurantId-error" />
      <span class="vote-card__body">
        <span class="vote-card__name">${escapeHtml(restaurant.name)}</span>
        <span class="vote-card__meta">
          ${restaurantMeta(restaurant)}
        </span>
      </span>
    </label>
  `;
}
