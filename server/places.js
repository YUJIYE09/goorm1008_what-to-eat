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

const AREA_SEARCH_MAX = 20; // 직접 검색한 동네 이름 최대 글자 수
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

// 동네·역 이름 → 중심 좌표 (카카오 검색 결과 첫 번째 장소)
async function findCenter(keyword, apiKey) {
  const params = new URLSearchParams({ query: keyword, size: '1' });
  const response = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?${params}`, {
    headers: { Authorization: `KakaoAK ${apiKey}` },
  });
  if (!response.ok) {
    console.error('카카오 지역 검색 실패:', response.status, await response.text());
    return { status: 502, error: 'kakao_failed' };
  }
  const data = await response.json();
  const doc = data.documents[0];
  const lat = Number(doc?.y);
  const lng = Number(doc?.x);
  if (!doc || !isInKorea(lat, lng)) return { status: 404, error: 'area_not_found' };
  return { center: { lat, lng } };
}

// 요청 주소의 값(query)을 받아 검색하고 { status, body }를 돌려줘요
export async function searchPlaces(query, apiKey) {
  if (!apiKey) {
    return { status: 503, body: { error: 'not_configured' } };
  }

  // 음식 종류는 쉼표로 여러 개 올 수 있어요 (예: "korean,meat")
  const categories = [...new Set(String(query.category ?? '').split(','))];
  if (categories.length === 0 || !categories.every((key) => key in CATEGORY_QUERIES)) {
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
    // 직접 검색한 동네·역 이름 (예: "을지로3가역") → 카카오에서 그 장소의 좌표를 찾아요
    area = area.trim();
    if (area.length < 2 || area.length > AREA_SEARCH_MAX) {
      return { status: 400, body: { error: 'bad_area' } };
    }
    const found = await findCenter(area, apiKey);
    if (found.error) return { status: found.status, body: { error: found.error } };
    center = found.center;
  }

  // 종류가 하나면 2쪽(최대 30곳), 여러 개면 종류마다 1쪽(15곳)씩 검색해요
  const pages = categories.length === 1 ? PAGES : 1;
  const places = [];
  for (const category of categories) {
    const result = await searchCategory({ category, center, area, pages, apiKey });
    if (result.error) return { status: 502, body: { error: result.error } };
    places.push(...result.places);
  }

  if (categories.length === 1) return { status: 200, body: { places } };

  // 여러 종류: 같은 식당은 한 번만, 가까운 순으로 섞어서 보여줘요
  const unique = [...new Map(places.map((place) => [place.id, place])).values()];
  unique.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  return { status: 200, body: { places: unique } };
}

// 음식 종류 하나를 카카오에서 검색해요
async function searchCategory({ category, center, area, pages, apiKey }) {
  const places = [];
  for (let page = 1; page <= pages; page += 1) {
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
      return { error: 'kakao_failed' };
    }

    const data = await response.json();
    places.push(...data.documents.map((doc) => toPlace(doc, { area, category })));
    if (data.meta.is_end) break; // 더 없으면 그만
  }
  return { places };
}
