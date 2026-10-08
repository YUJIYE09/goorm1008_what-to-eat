// 말로 쓴 조건 → 모임 조건 (v0.4)
// - AI(Claude)가 연결돼 있으면: 서버 함수 /api/parse 를 거쳐 AI가 정리해요
// - 연결 전이거나 실패하면: 규칙(정해진 단어 찾기)으로 정리해요
import { parseText } from '../utils/parseText.js';

// 돌려주는 값: { source: 'ai' | 'rule', conditions }
export async function parseConditions(text) {
  try {
    const response = await fetch('/api/parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (response.ok) {
      const data = await response.json();
      if (data.conditions) return { source: 'ai', conditions: data.conditions };
    }
  } catch {
    // 인터넷 문제 등은 아래 규칙 방식으로 넘어가요
  }
  return { source: 'rule', conditions: parseText(text) };
}
