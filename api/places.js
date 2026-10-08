// Vercel 서버 함수: 주소 /api/places 로 요청하면 실행돼요.
// 예: /api/places?area=홍대&category=meat
// 카카오 키는 Vercel 환경 변수 KAKAO_REST_API_KEY 에서 읽어요 (VITE_ 를 붙이지 않아야 브라우저에 노출되지 않아요).
import { searchPlaces } from '../server/places.js';

export default async function handler(req, res) {
  try {
    const { status, body } = await searchPlaces(req.query, process.env.KAKAO_REST_API_KEY);
    // 같은 검색은 1시간 동안 Vercel이 기억해 둬서 카카오 호출 횟수를 줄여요
    if (status === 200) res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(status).json(body);
  } catch (error) {
    console.error('식당 검색 오류:', error);
    res.status(500).json({ error: 'server_error' });
  }
}
