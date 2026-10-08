// 모임 만들기 입력값 검사
// 문제가 있는 칸만 { 칸이름: '오류 메시지' } 형태로 돌려줘요. 비어 있으면 통과!

import { AREAS, NEAR_ME, CATEGORY_LABELS, ATMOSPHERE_LABELS } from './format.js';

export function validateGroup(values) {
  const errors = {};

  const name = values.name.trim();
  if (name.length === 0) {
    errors.name = '모임 이름을 입력해주세요.';
  } else if (name.length > 30) {
    errors.name = '모임 이름은 30자 이하로 입력해주세요.';
  }

  if (!AREAS.includes(values.area) && values.area !== NEAR_ME) {
    errors.area = '지역을 선택해주세요.';
  }

  // 빈칸이면 Number('')가 0이 되므로 먼저 빈칸인지 확인해요
  const people = Number(values.people);
  if (values.people === '') {
    errors.people = '인원수를 입력해주세요.';
  } else if (!Number.isInteger(people) || people < 1 || people > 100) {
    errors.people = '인원은 1~100명 사이로 입력해주세요.';
  }

  const budget = Number(values.budget);
  if (values.budget === '') {
    errors.budget = '1인 예산을 입력해주세요.';
  } else if (!Number.isFinite(budget) || budget < 1000 || budget > 1000000) {
    errors.budget = '예산은 1,000~1,000,000원 사이로 입력해주세요.';
  }

  if (!(values.category in CATEGORY_LABELS)) {
    errors.category = '음식 종류를 선택해주세요.';
  }

  if (!(values.atmosphere in ATMOSPHERE_LABELS)) {
    errors.atmosphere = '분위기를 선택해주세요.';
  }

  return errors;
}

// 투표 만들기 입력값 검사
export function validateVote({ title, deadline }) {
  const errors = {};

  const trimmed = title.trim();
  if (trimmed.length === 0) {
    errors.title = '투표 제목을 입력해주세요.';
  } else if (trimmed.length > 50) {
    errors.title = '투표 제목은 50자 이하로 입력해주세요.';
  }

  if (!deadline) {
    errors.deadline = '마감 시간을 선택해주세요.';
  } else if (new Date(deadline) <= new Date()) {
    errors.deadline = '마감 시간은 지금보다 뒤로 정해주세요.';
  }

  return errors;
}

// 투표하기 입력값 검사 (명세서 9.6 문구 그대로)
export function validateVoteResponse({ voterName, restaurantId }) {
  const errors = {};
  if (voterName.trim().length === 0) errors.voterName = '이름을 입력해주세요.';
  else if (voterName.trim().length > 20) errors.voterName = '이름은 20자 이하로 입력해주세요.';
  if (!restaurantId) errors.restaurantId = '식당을 하나 선택해주세요.';
  return errors;
}
