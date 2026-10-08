// 후보 식당 목록 HTML (각 줄에 삭제 버튼)
import { formatPrice } from '../utils/format.js';

export function CandidateList(candidates) {
  const items = candidates
    .map(
      (restaurant) => `
        <li class="candidate">
          <div class="candidate__info">
            <h2 class="candidate__name">${restaurant.name}</h2>
            <p class="candidate__meta">
              <span aria-hidden="true">⭐</span> ${restaurant.rating.toFixed(1)}
              · ${formatPrice(restaurant.pricePerPerson)} · ${restaurant.area}
            </p>
          </div>
          <button type="button" class="btn btn--ghost" data-remove-id="${restaurant.id}"
            aria-label="${restaurant.name} 후보에서 삭제">삭제</button>
        </li>`
    )
    .join('');

  return `<ul class="candidate-list">${items}</ul>`;
}
