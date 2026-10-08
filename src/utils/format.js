// 화면에 보여줄 글자 모음과 숫자·날짜 꾸미기 함수

export const AREAS = ['홍대', '강남', '성수', '잠실', '종로', '여의도', '판교'];

// 현재 위치 기준으로 찾기 (v0.3)
export const NEAR_ME = '내 주변';

// 저장할 때는 영어 값, 화면에는 한글 이름을 보여줘요
export const CATEGORY_LABELS = {
  korean: '🍚 한식',
  japanese: '🍣 일식',
  chinese: '🥟 중식',
  western: '🍝 양식',
  meat: '🥩 고기',
  chicken: '🍗 치킨',
  cafe: '☕ 카페',
};

export const ATMOSPHERE_LABELS = {
  casual: '😄 편안한',
  quiet: '🤫 조용한',
  romantic: '🕯️ 분위기 있는',
  group: '🎉 단체 모임',
};

// 30000 → "30,000원"
export function formatPrice(number) {
  return `${Number(number).toLocaleString('ko-KR')}원`;
}

// 오늘 날짜 → "2026-10-08"
export function formatDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

// 사용자가 입력한 글자에 <, > 같은 기호가 있어도 화면에 안전하게 보여주기
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Date → "2026-10-08T23:59" (input type="datetime-local"에 넣는 형식, 내 컴퓨터 시간 기준)
export function toDateTimeLocal(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

// "2026-10-08T23:59" → "10월 8일 (수) 오후 11:59"
export function formatDeadline(value) {
  return new Date(value).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// 350 → "350m", 1234 → "1.2km"
export function formatDistance(meters) {
  if (!meters && meters !== 0) return '';
  return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
}

// 식당 한 줄 정보: 실제 식당(카카오)이면 거리·종류, 샘플이면 평점·가격
export function restaurantMeta(restaurant) {
  if (String(restaurant.id).startsWith('k')) {
    return [
      restaurant.distance ? `🚶 ${formatDistance(restaurant.distance)}` : '',
      escapeHtml(restaurant.categoryName ?? ''),
      escapeHtml(restaurant.area ?? ''),
    ]
      .filter(Boolean)
      .join(' · ');
  }
  return `⭐ ${Number(restaurant.rating).toFixed(1)} · ${formatPrice(restaurant.pricePerPerson)} · ${escapeHtml(restaurant.area)}`;
}

// 카카오맵 링크만 허용 (다른 주소가 섞여 들어와도 링크로 만들지 않아요)
export function safePlaceUrl(url) {
  return /^https?:\/\/place\.map\.kakao\.com\/\d+$/.test(String(url ?? '')) ? url : '';
}
