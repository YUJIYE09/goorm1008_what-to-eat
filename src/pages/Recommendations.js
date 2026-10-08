// 추천 화면: 입력한 조건 + 조건에 맞는 식당 카드 목록
// v0.3: 카카오 장소 검색으로 실제 식당을 보여주고, 연결 전이거나 실패하면 샘플 식당을 보여줘요.
import {
  getCurrentGroup,
  getCandidateIds,
  addCandidate,
  removeCandidate,
} from '../services/storage.js';
import { recommendRestaurants } from '../services/recommendation.js';
import { getPlaces } from '../services/placeService.js';
import { RestaurantCard } from '../components/RestaurantCard.js';
import {
  formatPrice,
  escapeHtml,
  CATEGORY_LABELS,
  ATMOSPHERE_LABELS,
} from '../utils/format.js';

let shown = []; // 지금 화면에 보이는 식당들 (후보에 담을 때 정보를 찾으려고)

// 못 먹는 음식 종류 → 카카오 업종 이름에서 찾을 단어 (v0.4)
const AVOID_PATTERNS = {
  meat: /육류|고기|삼겹|갈비|곱창|막창|한우|족발|보쌈|정육/,
  chicken: /치킨|닭/,
  japanese: /일식|초밥|스시|라멘|돈까스|돈카츠|이자카야/,
  chinese: /중식|중국/,
  western: /양식|이탈리|피자|스테이크|파스타/,
  korean: /한식/,
  cafe: /카페|커피|디저트/,
};

// 못 먹는 음식이 있는 식당 빼기
function withoutAvoided(places, avoid = []) {
  if (!Array.isArray(avoid) || avoid.length === 0) return places;
  return places.filter(
    (place) =>
      !avoid.includes(place.category) &&
      !avoid.some((key) => AVOID_PATTERNS[key]?.test(place.categoryName ?? ''))
  );
}

export async function Recommendations() {
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

  const result = await getPlaces(group);
  const { source, reason } = result;
  const places = withoutAvoided(result.places, group.avoid);
  const candidateIds = getCandidateIds(group.id); // 이미 후보에 담은 식당

  const header = `
      <h1 class="page__title">${escapeHtml(group.name)}</h1>
      <p class="summary">
        ${escapeHtml(group.area)} · ${group.people}명 · ${formatPrice(group.budget)}
      </p>
      <p class="summary summary--sub">
        ${CATEGORY_LABELS[group.category]} · ${ATMOSPHERE_LABELS[group.atmosphere]}
        ${avoidLabel(group.avoid)}
        · <a href="#/create" class="link">조건 변경</a>
      </p>`;

  if (source === 'kakao') {
    shown = places;
    return PlaceList(group, places, candidateIds, header);
  }

  const results = recommendRestaurants(places, group); // 샘플: 점수 높은 순
  shown = results;

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
      ${header}
      <p class="notice">${SAMPLE_NOTICE[reason] ?? SAMPLE_NOTICE.failed}</p>
      ${list}
    </section>
    ${results.length > 0 ? CandidateBar(candidateIds.length) : ''}
  `;
}

// "🚫 고기 제외" 표시
function avoidLabel(avoid) {
  if (!Array.isArray(avoid) || avoid.length === 0) return '';
  const names = avoid
    .filter((key) => key in CATEGORY_LABELS)
    .map((key) => CATEGORY_LABELS[key].split(' ')[1]);
  return names.length ? `· 🚫 ${names.join(', ')} 제외` : '';
}

// 샘플 데이터를 보여주는 이유
const SAMPLE_NOTICE = {
  not_configured: '🧪 실제 식당 검색이 아직 연결되지 않아 가상의 샘플 식당을 보여드려요.',
  offline: '📡 인터넷 연결이 불안정해서 가상의 샘플 식당을 보여드려요.',
  failed: '⚠️ 실제 식당을 불러오지 못해 가상의 샘플 식당을 보여드려요. 잠시 후 다시 시도해 주세요.',
};

// 실제 식당 목록 (카카오 검색 결과 순서 = 검색어와 잘 맞는 순)
function PlaceList(group, places, candidateIds, header) {
  const where = group.area === '내 주변' ? '내 주변' : `${escapeHtml(group.area)} 근처`;
  const body =
    places.length > 0
      ? `<p class="result-count">${where} 식당 <strong>${places.length}곳</strong> · 반경 2km</p>
         <p class="hint">가격·평점·영업시간은 카드의 카카오맵 링크에서 확인할 수 있어요.</p>
         <div class="card-list">${places
           .map((p) => RestaurantCard(p, { isCandidate: candidateIds.includes(p.id) }))
           .join('')}</div>`
      : `<div class="empty">
           <p><strong>${where}에서 이 종류의 식당을 찾지 못했어요.</strong></p>
           <p>다른 음식 종류나 지역으로 바꿔보세요.</p>
           <a href="#/create" class="btn btn--primary">조건 다시 설정</a>
         </div>`;

  return `
    <section class="page">
      ${header}
      ${body}
    </section>
    ${places.length > 0 ? CandidateBar(candidateIds.length) : ''}
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
        const restaurant = shown.find((r) => r.id === restaurantId);
        if (!restaurant) return;
        // 점수 같은 화면용 값은 빼고 식당 정보만 저장해요
        const { score, matches, ...info } = restaurant;
        addCandidate(group.id, info);
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
