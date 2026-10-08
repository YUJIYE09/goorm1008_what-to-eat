// 카카오 장소 검색으로 실제 식당 찾기 (v0.3)
// 이 파일은 브라우저가 아니라 서버(Vercel 함수, 개발 서버)에서만 실행돼요.
// 카카오 REST API 키는 비밀이라 브라우저 코드에 넣으면 안 되기 때문이에요.

// 지역 이름 → 중심 좌표 (위도 lat, 경도 lng)
export const AREA_CENTERS = {
  홍대: { lat: 37.5572, lng: 126.9245 }, // 홍대입구역
  강남: { lat: 37.4979, lng: 127.0276 }, // 강남역
  성수: { lat: 37.5446, lng: 127.0557 }, // 성수역
  잠실: { lat: 37.5133, lng: 127.1001 }, // 잠실역
  종로: { lat: 37.5702, lng: 126.9832 }, // 종각역
  여의도: { lat: 37.5216, lng: 126.9242 }, // 여의도역
  판교: { lat: 37.3948, lng: 127.1112 }, // 판교역
};

// 음식 종류 → 카카오에서 검색할 단어
const CATEGORY_QUERIES = {
  korean: '한식',
  japanese: '일식',
  chinese: '중식',
  western: '양식',
  meat: '고기',
  chicken: '치킨',
  cafe: '카페',
};

const SEARCH_RADIUS = 2000; // 중심에서 2km 안
const PAGES = 2; // 한 번에 15곳 × 2쪽 = 최대 30곳

// 한국 안의 좌표인지 대략 확인 (아무 좌표나 넣어 남의 키를 쓰지 못하게)
function isInKorea(lat, lng) {
  return lat > 33 && lat < 39 && lng > 124 && lng < 132;
}

// 카카오 응답 한 곳 → 앱에서 쓰는 식당 모양
function toPlace(doc, { area, category }) {
  return {
    id: `k${doc.id}`,
    name: doc.place_name,
    area,
    category,
    categoryName: doc.category_name.split(' > ').slice(1).join(' · '), // "음식점 > 한식 > 육류,고기" → "한식 · 육류,고기"
    address: doc.road_address_name || doc.address_name,
    phone: doc.phone,
    distance: Number(doc.distance) || null, // 중심에서 몇 m
    lat: Number(doc.y),
    lng: Number(doc.x),
    placeUrl: doc.place_url.replace(/^http:/, 'https:'), // 카카오맵 상세 페이지 (평점·영업시간·메뉴)
  };
}

// 요청 주소의 값(query)을 받아 검색하고 { status, body }를 돌려줘요
export async function searchPlaces(query, apiKey) {
  if (!apiKey) {
    return { status: 503, body: { error: 'not_configured' } };
  }

  const category = String(query.category ?? '');
  if (!(category in CATEGORY_QUERIES)) {
    return { status: 400, body: { error: 'bad_category' } };
  }

  // 위치: 내 주변이면 lat/lng, 아니면 정해진 지역의 중심
  let center;
  let area = String(query.area ?? '');
  if (area === '내 주변') {
    const lat = Number(query.lat);
    const lng = Number(query.lng);
    if (!isInKorea(lat, lng)) return { status: 400, body: { error: 'bad_location' } };
    center = { lat, lng };
  } else if (AREA_CENTERS[area]) {
    center = AREA_CENTERS[area];
  } else {
    return { status: 400, body: { error: 'bad_area' } };
  }

  const places = [];
  for (let page = 1; page <= PAGES; page += 1) {
    const params = new URLSearchParams({
      query: CATEGORY_QUERIES[category],
      category_group_code: category === 'cafe' ? 'CE7' : 'FD6', // FD6 음식점, CE7 카페
      x: String(center.lng),
      y: String(center.lat),
      radius: String(SEARCH_RADIUS),
      size: '15',
      page: String(page),
    });

    const response = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${params}`, {
      headers: { Authorization: `KakaoAK ${apiKey}` },
    });
    if (!response.ok) {
      console.error('카카오 검색 실패:', response.status, await response.text());
      return { status: 502, body: { error: 'kakao_failed' } };
    }

    const data = await response.json();
    places.push(...data.documents.map((doc) => toPlace(doc, { area, category })));
    if (data.meta.is_end) break; // 더 없으면 그만
  }

  return { status: 200, body: { places } };
}
