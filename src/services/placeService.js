// 식당 데이터 창구 (v0.3)
// - 카카오 장소 검색이 연결돼 있으면: 실제 식당 (서버 함수 /api/places 를 거쳐요)
// - 연결 전이거나 실패하면: 예전 샘플 데이터
import { restaurants as sampleRestaurants } from '../data/restaurants.js';
import { groupCategories, DEFAULT_RADIUS, DEFAULT_SORT } from '../utils/format.js';

const cache = new Map(); // 같은 조건으로 다시 들어오면 다시 묻지 않아요

// 모임 조건으로 식당 목록 가져오기
// 돌려주는 값: { source: 'kakao' | 'sample', places, reason? }
export async function getPlaces(group) {
  const params = new URLSearchParams({
    area: group.area,
    category: groupCategories(group).join(','),
    atmosphere: group.atmosphere ?? '', // 분위기는 검색어에 섞어서 비슷하게 찾아요
    sort: group.sort ?? DEFAULT_SORT, // 추천 순(accuracy) / 가까운 순(distance)
    radius: String(group.radius ?? DEFAULT_RADIUS), // 검색 거리 (m)
  });
  if (group.lat && group.lng) {
    params.set('lat', group.lat.toFixed(4)); // 소수 4자리 ≈ 10m (정확한 위치를 보내지 않아요)
    params.set('lng', group.lng.toFixed(4));
  }
  const key = params.toString();
  if (cache.has(key)) return cache.get(key);

  let result;
  try {
    const response = await fetch(`/api/places?${key}`);
    const data = await response.json().catch(() => ({}));
    if (response.ok && Array.isArray(data.places)) {
      result = { source: 'kakao', places: data.places };
      cache.set(key, result);
    } else {
      result = { source: 'sample', places: sampleRestaurants, reason: data.error ?? 'failed' };
    }
  } catch {
    result = { source: 'sample', places: sampleRestaurants, reason: 'offline' };
  }
  return result;
}

// 현재 위치 가져오기 (사용자가 허락해야 해요)
export function getMyLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('unsupported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      (error) => reject(error),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}
