// LocalStorage(브라우저 저장소)를 다루는 곳은 이 파일 하나뿐이에요.
// 다른 파일에서는 localStorage를 직접 쓰지 않고 아래 함수만 사용해요.

export const STORAGE_KEYS = {
  groups: 'whatToEat_groups',
  candidates: 'whatToEat_candidates',
  votes: 'whatToEat_votes',
  responses: 'whatToEat_responses',
};

// 데이터를 글자(JSON)로 바꿔서 저장
export function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('저장 실패:', error);
    return false;
  }
}

// 저장된 글자(JSON)를 다시 데이터로 바꿔서 꺼내기 (없으면 fallback)
export function getData(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (error) {
    console.error('불러오기 실패:', error);
    return fallback;
  }
}

// 목록(배열)으로 저장된 값 꺼내기: 배열이 아니면(깨진 데이터) 빈 목록으로
function getList(key) {
  const data = getData(key, []);
  return Array.isArray(data) ? data : [];
}

// 특정 키 하나 지우기
export function removeData(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('삭제 실패:', error);
  }
}

// 키의 내용을 빈 목록으로 초기화
export function clearData(key) {
  saveData(key, []);
}

// ===== 모임·후보 도우미 (Phase 5) =====
// 화면 파일들은 아래 함수만 쓰면 돼요. 저장 방식은 이 파일 안에서만 알아요.

// 저장된 데이터가 깨졌는지 간단히 확인 (필요한 값이 다 있는지)
function isValidGroup(group) {
  return Boolean(
    group && group.id && group.name && group.area && group.people > 0 && group.budget > 0
  );
}

// 새 모임 저장
export function addGroup(group) {
  return saveData(STORAGE_KEYS.groups, [...getList(STORAGE_KEYS.groups), group]);
}

// 가장 최근에 만든 모임 가져오기 (깨진 데이터면 없는 것으로 처리)
export function getCurrentGroup() {
  const groups = getList(STORAGE_KEYS.groups);
  const group = groups[groups.length - 1];
  return isValidGroup(group) ? group : null;
}

// 이 모임의 후보 식당 id 목록 (예: ['r001', 'r005'])
export function getCandidateIds(groupId) {
  return getList(STORAGE_KEYS.candidates)
    .filter((candidate) => candidate.groupId === groupId)
    .map((candidate) => candidate.restaurantId);
}

// 후보에 추가
export function addCandidate(groupId, restaurantId) {
  const candidates = getList(STORAGE_KEYS.candidates);
  const exists = candidates.some(
    (c) => c.groupId === groupId && c.restaurantId === restaurantId
  );
  if (!exists) {
    saveData(STORAGE_KEYS.candidates, [...candidates, { groupId, restaurantId }]);
  }
}

// 후보에서 삭제
export function removeCandidate(groupId, restaurantId) {
  const candidates = getList(STORAGE_KEYS.candidates);
  saveData(
    STORAGE_KEYS.candidates,
    candidates.filter((c) => !(c.groupId === groupId && c.restaurantId === restaurantId))
  );
}

// ===== 투표 도우미 (Phase 6) =====

// 투표 만들기 → 만든 투표를 돌려줘요
export function createVote({ groupId, title, candidates, deadline }) {
  const vote = {
    id: `v${Date.now()}`,
    groupId,
    title,
    candidates, // 식당 id 목록
    deadline, // 예: "2026-10-08T23:59"
    createdAt: new Date().toISOString(),
  };
  saveData(STORAGE_KEYS.votes, [...getList(STORAGE_KEYS.votes), vote]);
  return vote;
}

// id로 투표 찾기 (id가 없으면 가장 최근 투표, 깨진 데이터면 없는 것으로 처리)
export function getVote(voteId) {
  const votes = getList(STORAGE_KEYS.votes);
  const vote = voteId ? votes.find((v) => v.id === voteId) : votes[votes.length - 1];
  const isValid = vote && vote.title && vote.deadline && Array.isArray(vote.candidates);
  return isValid ? vote : null;
}

// 이 투표에 들어온 응답 목록
export function getResponses(voteId) {
  return getList(STORAGE_KEYS.responses).filter((r) => r.voteId === voteId);
}

// 투표하기: 같은 이름으로 다시 투표하면 이전 선택을 바꿔요 (한 사람당 한 표)
// 돌려주는 값: 이미 투표한 적이 있으면 true
export function saveResponse({ voteId, voterName, restaurantId }) {
  const responses = getList(STORAGE_KEYS.responses);
  const others = responses.filter((r) => !(r.voteId === voteId && r.voterName === voterName));
  saveData(STORAGE_KEYS.responses, [...others, { voteId, voterName, restaurantId }]);
  return others.length !== responses.length;
}
