// Vercel 서버 함수: POST /api/parse  { text: "6명이서 성수에서..." }
// Claude API 키는 Vercel 환경 변수 ANTHROPIC_API_KEY 에서 읽어요 (VITE_ 없이!).
import { parseRequest } from '../server/parse.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  try {
    const { status, body } = await parseRequest(req.body, process.env.ANTHROPIC_API_KEY);
    res.status(status).json(body);
  } catch (error) {
    console.error('AI 조건 정리 오류:', error);
    res.status(500).json({ error: 'server_error' });
  }
}
