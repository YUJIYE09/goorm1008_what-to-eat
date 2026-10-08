// 규칙으로 문장에서 조건 찾기 (v0.4)
// AI를 쓸 수 없을 때(키 없음, 오류) 대신 쓰는 간단한 방법이에요.
// 정해진 단어를 찾는 방식이라 AI보다 덜 똑똑하지만, 무료이고 바로 동작해요.
import { AREAS, NEAR_ME } from './format.js';

// 지역 별명 → 지역
const AREA_ALIASES = {
  홍대: ['홍대', '홍익대', '연남', '망원', '합정', '상수'],
  강남: ['강남', '역삼', '신논현', '논현'],
  성수: ['성수', '서울숲', '뚝섬'],
  잠실: ['잠실', '송파', '석촌', '송리단길'],
  종로: ['종로', '종각', '광화문', '인사동', '익선동', '광장시장'],
  여의도: ['여의도'],
  판교: ['판교'],
};

// 음식 종류별 단어
const CATEGORY_WORDS = {
  meat: ['고기', '삼겹', '소고기', '돼지고기', '갈비', '한우', '곱창', '육류'],
  korean: ['한식', '국밥', '찌개', '백반', '한정식', '솥밥'],
  japanese: ['일식', '스시', '초밥', '라멘', '오마카세', '이자카야', '돈카츠', '돈까스'],
  chinese: ['중식', '중국', '짜장', '짬뽕', '마라', '딤섬'],
  western: ['양식', '파스타', '피자', '스테이크', '브런치'],
  chicken: ['치킨', '통닭'],
  cafe: ['카페', '커피', '디저트'],
};

const ATMOSPHERE_WORDS = {
  quiet: ['조용', '시끄럽지 않', '안 시끄러', '차분', '대화하기 좋'],
  romantic: ['분위기 좋', '분위기 있', '데이트', '로맨틱', '기념일'],
  group: ['회식', '단체', '여럿이'],
  casual: ['편하게', '편한', '캐주얼', '가볍게'],
};

// 한글 숫자 (두 명, 셋이서 …)
const KOREAN_NUMBERS = {
  한: 1, 혼자: 1, 두: 2, 둘: 2, 세: 3, 셋: 3, 네: 4, 넷: 4, 다섯: 5,
  여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9, 열: 10,
};

// "고기를 못 먹어", "고기 빼고" 처럼 피하는 말이 뒤따르는지
function isAvoided(text, word) {
  const pattern = new RegExp(`${word}\\S*\\s*(?:는|은|를|을)?\\s*(?:못|안|싫|빼|제외|말고)`);
  return pattern.test(text);
}

export function parseText(input) {
  const text = String(input).replace(/\s+/g, ' ');

  // 지역
  let area = '';
  for (const [name, aliases] of Object.entries(AREA_ALIASES)) {
    if (aliases.some((alias) => text.includes(alias))) {
      area = name;
      break;
    }
  }
  if (!area && /내 주변|근처|주변|여기서/.test(text)) area = NEAR_ME;
  if (area && area !== NEAR_ME && !AREAS.includes(area)) area = '';

  // 인원: "6명", "여섯 명", "셋이서", "10인" ("1인 4만원"의 1인은 인원이 아니에요)
  let people = '';
  const digitPeople = text.match(/(\d+)\s*명/);
  const word = Object.keys(KOREAN_NUMBERS)
    .sort((a, b) => b.length - a.length)
    .find(
      (w) =>
        new RegExp(`${w}\\s*(?:명|이서|사람)`).test(text) &&
        !new RegExp(`${w}\\s*명은`).test(text) // "한 명은 고기를 못 먹어"는 인원이 아니에요
    );
  const digitIn = text.match(/(\d+)\s*인(?!\s*당)/);
  if (digitPeople) people = Number(digitPeople[1]);
  else if (word) people = KOREAN_NUMBERS[word];
  else if (digitIn && Number(digitIn[1]) > 1) people = Number(digitIn[1]);

  // 예산: "3만원", "3.5만", "25000원" (1인 기준으로 봐요)
  let budget = '';
  const man = text.match(/(\d+(?:\.\d+)?)\s*만\s*원?/);
  const won = text.match(/(\d{4,7})\s*원/);
  if (man) budget = Math.round(Number(man[1]) * 10000);
  else if (won) budget = Number(won[1]);
  else if (/(?:^|\s)만\s*원/.test(text)) budget = 10000; // "만원"


  // 피할 음식, 원하는 음식
  const avoid = [];
  let category = '';
  for (const [key, words] of Object.entries(CATEGORY_WORDS)) {
    const found = words.filter((w) => text.includes(w));
    if (found.length === 0) continue;
    if (found.some((w) => isAvoided(text, w))) avoid.push(key);
    else if (!category) category = key;
  }

  // 분위기
  let atmosphere = '';
  for (const [key, words] of Object.entries(ATMOSPHERE_WORDS)) {
    if (words.some((w) => text.includes(w))) {
      atmosphere = key;
      break;
    }
  }

  return { name: '', area, people, budget, category, atmosphere, avoid, notes: '' };
}
