// 화면에 보여줄 글자 모음과 숫자·날짜 꾸미기 함수

export const AREAS = ['홍대', '강남', '성수', '잠실', '종로', '여의도', '판교'];

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
