// 추천 화면: 입력한 조건 + 조건에 맞는 식당 카드 목록
import {
  getCurrentGroup,
  getCandidateIds,
  addCandidate,
  removeCandidate,
} from '../services/storage.js';
import { recommendRestaurants } from '../services/recommendation.js';
import { restaurants } from '../data/restaurants.js';
import { RestaurantCard } from '../components/RestaurantCard.js';
import {
  formatPrice,
  escapeHtml,
  CATEGORY_LABELS,
  ATMOSPHERE_LABELS,
} from '../utils/format.js';

export function Recommendations() {
  const group = getCurrentGroup();

  // 모임이 없으면 빈 화면 대신 안내를 보여줘요
  if (!group) {
    return `
      <section class="page empty">
        <h1 class="page__title">아직 만든 모임이 없어요</h1>
        <p>조건을 입력하면 식당을 추천해 드려요.</p>
        <a href="#/create" class="btn btn--primary">+ 새 모임 만들기</a>
      </section>
    `;
  }

  const results = recommendRestaurants(restaurants, group); // 점수 높은 순
  const candidateIds = getCandidateIds(group.id); // 이미 후보에 담은 식당

  // 선택한 지역 식당과 다른 지역 식당을 나눠서 보여줘요 (각각 점수 높은 순)
  const sameArea = results.filter((r) => r.matches.area);
  const otherArea = results.filter((r) => !r.matches.area);

  const section = (title, items) =>
    items.length > 0
      ? `<h2 class="section-title">${title} <span>${items.length}곳</span></h2>
         <div class="card-list">${items
           .map((r) => RestaurantCard(r, { isCandidate: candidateIds.includes(r.id) }))
           .join('')}</div>`
      : '';

  const list =
    results.length > 0
      ? `<p class="result-count">조건에 맞는 식당 <strong>${results.length}곳</strong> · 추천 점수 높은 순</p>
         ${
           sameArea.length > 0
             ? section(`📍 ${group.area} 추천`, sameArea)
             : `<p class="notice">${group.area}에는 조건에 맞는 식당이 없어서 다른 지역을 보여드려요.</p>`
         }
         ${section('🚶 다른 지역 추천', otherArea)}`
      : `<div class="empty">
           <p><strong>아직 조건에 맞는 식당을 찾지 못했어요.</strong></p>
           <p>검색 조건을 조금 완화해보세요.</p>
           <a href="#/create" class="btn btn--primary">조건 다시 설정</a>
         </div>`;

  return `
    <section class="page">
      <h1 class="page__title">${escapeHtml(group.name)}</h1>
      <p class="summary">
        ${group.area} · ${group.people}명 · ${formatPrice(group.budget)}
      </p>
      <p class="summary summary--sub">
        ${CATEGORY_LABELS[group.category]} · ${ATMOSPHERE_LABELS[group.atmosphere]}
        · <a href="#/create" class="link">조건 변경</a>
      </p>
      ${list}
    </section>
    ${results.length > 0 ? CandidateBar(candidateIds.length) : ''}
  `;
}

// 화면 아래에 붙어 있는 "후보 N개 보기" 바
function CandidateBar(count) {
  return `
    <div class="bottom-bar">
      <div class="container bottom-bar__inner">
        <p aria-live="polite">담은 후보 <strong id="candidate-count">${count}</strong>개</p>
        <a href="#/candidates" class="btn btn--primary">후보 보기 →</a>
      </div>
    </div>
  `;
}

// "후보에 추가" 버튼 연결: 누를 때마다 추가 ↔ 취소, LocalStorage에 저장돼요
export function mountRecommendations() {
  const group = getCurrentGroup();
  if (!group) return;

  document.querySelectorAll('[data-candidate-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const restaurantId = button.dataset.candidateId;
      const added = button.getAttribute('aria-pressed') === 'true';

      if (added) {
        removeCandidate(group.id, restaurantId);
      } else {
        addCandidate(group.id, restaurantId);
      }

      // 버튼 모양 바꾸기
      button.setAttribute('aria-pressed', String(!added));
      button.classList.toggle('btn--done', !added);
      button.classList.toggle('btn--secondary', added);
      button.textContent = added ? '+ 후보에 추가' : '✓ 후보에 추가됨';

      // 아래 바의 후보 개수 갱신
      document.querySelector('#candidate-count').textContent =
        getCandidateIds(group.id).length;
    });
  });
}
