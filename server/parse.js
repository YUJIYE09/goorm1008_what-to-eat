// AI로 문장을 모임 조건으로 바꾸기 (v0.4)
// 예: "6명이서 성수에서 3만원 정도, 한 명은 고기를 못 먹어. 너무 시끄럽지 않은 곳"
//   → { area: '성수', people: 6, budget: 30000, avoid: ['meat'], atmosphere: 'quiet', ... }
// 이 파일은 서버에서만 실행돼요. Claude API 키(ANTHROPIC_API_KEY)는 비밀이에요.
import Anthropic from '@anthropic-ai/sdk';
import { AREA_CENTERS } from './places.js';

const AREAS = [...Object.keys(AREA_CENTERS), '내 주변'];
const CATEGORIES = ['korean', 'japanese', 'chinese', 'western', 'meat', 'chicken', 'cafe'];
const ATMOSPHERES = ['casual', 'quiet', 'romantic', 'group'];
const MAX_TEXT = 300; // 너무 긴 글은 받지 않아요 (사용량 보호)

// AI가 꼭 이 모양으로만 답하게 하는 틀 (모르는 값은 'unknown' 또는 0)
const SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: '모임 이름 제안 (15자 이내)' },
    area: { type: 'string', enum: [...AREAS, 'unknown'] },
    people: { type: 'integer', description: '인원수, 모르면 0' },
    budget: { type: 'integer', description: '1인 예산(원), 모르면 0' },
    category: { type: 'string', enum: [...CATEGORIES, 'unknown'] },
    atmosphere: { type: 'string', enum: [...ATMOSPHERES, 'unknown'] },
    avoid: { type: 'array', items: { type: 'string', enum: CATEGORIES } },
    notes: { type: 'string', description: '조건을 어떻게 이해했는지 한두 문장 (한국어, 존댓말)' },
  },
  required: ['name', 'area', 'people', 'budget', 'category', 'atmosphere', 'avoid', 'notes'],
  additionalProperties: false,
};

const SYSTEM = `너는 모임 식당 추천 앱 "뭐먹지?"의 입력 도우미야.
사용자가 쓴 문장에서 모임 조건을 뽑아 JSON으로만 답해.

- area: ${AREAS.join(', ')} 중 하나. 홍대입구·연남·망원은 홍대, 서울숲·성수동은 성수, 송파·석촌호수는 잠실, 광화문·인사동·익선동은 종로처럼 가까운 곳으로 맞춰. "근처", "여기 주변"이면 "내 주변". 알 수 없으면 "unknown".
- category: korean(한식), japanese(일식), chinese(중식), western(양식), meat(고기), chicken(치킨), cafe(카페). 원하는 음식이 없으면 "unknown".
- avoid: 못 먹거나 피하고 싶은 음식 종류. 예: "한 명은 고기를 못 먹어" → ["meat"]. avoid에 넣은 종류는 category로 고르지 마.
- atmosphere: casual(편안한), quiet(조용한, 시끄럽지 않은), romantic(분위기 있는, 데이트), group(단체, 회식). 알 수 없으면 "unknown".
- budget은 1인 기준 원 단위. "3만원 정도"는 30000. 총액만 말하면 인원수로 나눠.
- 문장에 없는 값을 지어내지 마.`;

// 사용자가 보낸 값({ text })을 받아 { status, body }를 돌려줘요
export async function parseRequest(input, apiKey) {
  if (!apiKey) return { status: 503, body: { error: 'not_configured' } };

  const text = String(input?.text ?? '').trim();
  if (!text || text.length > MAX_TEXT) return { status: 400, body: { error: 'bad_text' } };

  const client = new Anthropic({ apiKey });
  const response = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 2000,
    system: SYSTEM,
    output_config: {
      effort: 'low', // 간단한 정리 작업이라 빠르고 저렴하게
      format: { type: 'json_schema', schema: SCHEMA },
    },
    // AI가 안전 문제로 답을 거절하면 다른 모델로 자동으로 다시 시도해요
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    messages: [{ role: 'user', content: text }],
  });

  if (response.stop_reason === 'refusal') return { status: 422, body: { error: 'refused' } };

  const textBlock = response.content.find((block) => block.type === 'text');
  let parsed;
  try {
    parsed = JSON.parse(textBlock?.text ?? '');
  } catch {
    return { status: 502, body: { error: 'bad_output' } };
  }

  return { status: 200, body: { conditions: clean(parsed), source: 'ai' } };
}

// AI 답을 한 번 더 확인 (이상한 값은 비워요)
function clean(raw) {
  return {
    name: String(raw.name ?? '').slice(0, 30),
    area: AREAS.includes(raw.area) ? raw.area : '',
    people: Number.isInteger(raw.people) && raw.people >= 1 && raw.people <= 100 ? raw.people : '',
    budget:
      Number.isInteger(raw.budget) && raw.budget >= 1000 && raw.budget <= 1000000
        ? raw.budget
        : '',
    category: CATEGORIES.includes(raw.category) ? raw.category : '',
    atmosphere: ATMOSPHERES.includes(raw.atmosphere) ? raw.atmosphere : '',
    avoid: Array.isArray(raw.avoid) ? raw.avoid.filter((c) => CATEGORIES.includes(c)) : [],
    notes: String(raw.notes ?? '').slice(0, 200),
  };
}
