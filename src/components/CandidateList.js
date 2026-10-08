// 후보 식당 목록 HTML (각 줄에 삭제 버튼)
import { escapeHtml, restaurantMeta } from '../utils/format.js';

export function CandidateList(candidates) {
  const items = candidates
    .map((restaurant) => {
      const name = escapeHtml(restaurant.name);
      return `
        <li class="candidate">
          <div class="candidate__info">
            <h2 class="candidate__name">${name}</h2>
            <p class="candidate__meta">${restaurantMeta(restaurant)}</p>
          </div>
          <button type="button" class="btn btn--ghost" data-remove-id="${escapeHtml(restaurant.id)}"
            aria-label="${name} 후보에서 삭제">삭제</button>
        </li>`;
    })
    .join('');

  return `<ul class="candidate-list">${items}</ul>`;
}
