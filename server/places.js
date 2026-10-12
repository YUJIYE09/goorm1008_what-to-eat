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

// 분위기 → 검색어 앞에 붙일 말 (카카오는 분위기 정보를 주지 않아서 검색어로 비슷하게 찾아요)
// 편안한(casual)은 보통 검색과 같아서 붙이지 않아요
const ATMOSPHERE_WORDS = {
  quiet: '조용한',
  romantic: '데이트',
  group: '단체',
};

const AREA_SEARCH_MAX = 20; // 직접 검색한 동네 이름 최대 글자 수
const RADIUS_OPTIONS = [500, 1000, 2000]; // 고를 수 있는 거리 (m)
const DEFAULT_RADIUS = 2000; // 거리를 안 골랐으면 2km 안
const SORTS = ['accuracy', 'distance']; // 카카오 정렬: 정확도(검색어와 잘 맞는) 순 / 가까운 순
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

  // 검색 거리 (정해진 값이 아니면 2km)
  const radius = RADIUS_OPTIONS.includes(Number(query.radius)) ? Number(query.radius) : DEFAULT_RADIUS;

  // 정렬 (정해진 값이 아니면 정확도 순)
  const sort = SORTS.includes(query.sort) ? query.sort : 'accuracy';

  // 검색어 앞에 붙일 분위기 단어 (없거나 모르는 값이면 붙이지 않아요)
  const moodWords = [ATMOSPHERE_WORDS[String(query.atmosphere ?? '')]].filter(Boolean);

  // 종류가 하나면 2쪽(최대 30곳), 여러 개면 종류마다 1쪽(15곳)씩 검색해요
  const pages = categories.length === 1 ? PAGES : 1;
  const lists = [];
  for (const category of categories) {
    const result = await searchCategory({ category, center, area, pages, moodWords, radius, sort, apiKey });
    if (result.error) return { status: 502, body: { error: result.error } };
    lists.push(result.places);
  }

  return { status: 200, body: { places: combine(lists, sort) } };
}

// 종류별 검색 결과를 한 목록으로 합쳐요 (같은 식당은 한 번만)
// - 가까운 순: 전부 거리순으로
// - 정확도 순: 분위기 검색에 나온 곳 먼저, 그다음 종류별로 번갈아 하나씩 (한식1, 고기1, 한식2, ...)
function combine(lists, sort) {
  const seen = new Set();
  const unique = (list) => list.filter((place) => !seen.has(place.id) && seen.add(place.id));

  if (sort === 'distance') {
    return unique(lists.flat()).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }
  if (lists.length === 1) return unique(lists[0]);

  const interleaved = [];
  for (let i = 0; i < Math.max(...lists.map((list) => list.length)); i += 1) {
    for (const list of lists) if (list[i]) interleaved.push(list[i]);
  }
  const ordered = unique(interleaved);
  return [...ordered.filter((place) => place.moodMatch), ...ordered.filter((place) => !place.moodMatch)];
}

// 음식 종류 하나를 카카오에서 검색해요
// 분위기·인원 단어가 있으면 "조용한 한식", "단체 한식"으로 먼저 찾고(앞에 보여줘요), 이어서 "한식"으로 찾아 채워요
async function searchCategory({ category, center, area, pages, moodWords, radius, sort, apiKey }) {
  const places = [];
  const seen = new Set();
  const add = (list, mood) => {
    for (const place of list) {
      if (seen.has(place.id)) continue;
      seen.add(place.id);
      places.push(mood ? { ...place, moodMatch: true, mood } : place);
    }
  };
  for (const mood of moodWords) {
    const moodResult = await searchKeyword({ keyword: `${mood} ${CATEGORY_QUERIES[category]}`, category, center, area, pages: 1, radius, sort, apiKey });
    if (moodResult.error) return moodResult;
    add(moodResult.places, mood);
  }
  const plain = await searchKeyword({ keyword: CATEGORY_QUERIES[category], category, center, area, pages, radius, sort, apiKey });
  if (plain.error) return plain;
  add(plain.places, '');
  return { places };
}

// 검색어 하나로 카카오 장소 검색 (pages쪽까지)
async function searchKeyword({ keyword, category, center, area, pages, radius, sort, apiKey }) {
  const places = [];
  for (let page = 1; page <= pages; page += 1) {
    const params = new URLSearchParams({
      query: keyword,
      category_group_code: category === 'cafe' ? 'CE7' : 'FD6', // FD6 음식점, CE7 카페
      x: String(center.lng),
      y: String(center.lat),
      radius: String(radius),
      sort, // accuracy(정확도 순) 또는 distance(가까운 순)
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
