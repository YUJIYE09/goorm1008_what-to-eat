// 투표 데이터 창구 (v0.2)
// 화면 파일은 이 파일의 함수만 사용해요.
// - Supabase가 연결돼 있으면: 서버에 저장 → 링크를 받은 누구나 투표 가능, 결과 실시간 갱신
// - 연결돼 있지 않으면: 예전처럼 이 브라우저(LocalStorage)에 저장
// 서버와 통신하므로 모든 함수가 시간이 걸릴 수 있어서 async(비동기)예요.
import { supabase, isOnline } from './supabase.js';
import * as local from './storage.js';

export { isOnline };

// 서버 응답(snake_case)을 앱에서 쓰는 모양(camelCase)으로 바꾸기
function toVote(row) {
  return {
    id: row.id,
    title: row.title,
    groupName: row.group_name,
    candidates: row.candidates, // 후보 식당 정보 배열
    deadline: row.deadline,
    createdAt: row.created_at,
  };
}

function toResponse(row) {
  return {
    voteId: row.vote_id,
    voterName: row.voter_name,
    restaurantId: row.restaurant_id,
  };
}

// 후보 식당에서 투표에 필요한 정보만 골라 담기
// (다른 기기에는 샘플 데이터가 달라질 수 있어서, 식당 정보를 투표 안에 함께 저장해요)
function snapshot(restaurant) {
  const { id, name, rating, pricePerPerson, area, address, category } = restaurant;
  return { id, name, rating, pricePerPerson, area, address, category };
}

// 투표 만들기 → 만든 투표를 돌려줘요
export async function createVote({ groupId, groupName, title, candidates, deadline }) {
  const candidateInfo = candidates.map(snapshot);
  // "2026-10-08T23:59"(내 컴퓨터 시간) → 세계 표준시 형식으로 바꿔서 저장
  const deadlineIso = new Date(deadline).toISOString();

  if (!isOnline) {
    return local.createVote({ groupId, title, candidates: candidateInfo, deadline: deadlineIso });
  }

  const { data, error } = await supabase
    .from('votes')
    .insert({ title, group_name: groupName, candidates: candidateInfo, deadline: deadlineIso })
    .select()
    .single();
  if (error) throw error;
  return toVote(data);
}

// 투표 하나 가져오기 (없으면 null)
export async function getVote(voteId) {
  if (!isOnline) return local.getVote(voteId);
  if (!voteId) return null;
  // uuid 모양이 아니면 서버에 묻지 않고 "없음" 처리
  if (!/^[0-9a-f-]{36}$/i.test(voteId)) return null;

  const { data, error } = await supabase.from('votes').select('*').eq('id', voteId).maybeSingle();
  if (error) throw error;
  return data ? toVote(data) : null;
}

// 이 투표의 응답 목록
export async function getResponses(voteId) {
  if (!isOnline) return local.getResponses(voteId);

  const { data, error } = await supabase
    .from('responses')
    .select('vote_id, voter_name, restaurant_id')
    .eq('vote_id', voteId)
    .order('created_at');
  if (error) throw error;
  return data.map(toResponse);
}

// 투표하기 (같은 이름이면 선택을 바꿔요) → 이미 투표한 적이 있으면 true
export async function saveResponse({ voteId, voterName, restaurantId }) {
  if (!isOnline) return local.saveResponse({ voteId, voterName, restaurantId });

  const before = await getResponses(voteId);
  const changed = before.some((r) => r.voterName === voterName);

  const { error } = await supabase
    .from('responses')
    .upsert(
      { vote_id: voteId, voter_name: voterName, restaurant_id: restaurantId },
      { onConflict: 'vote_id,voter_name' }
    );
  if (error) throw error;
  return changed;
}

// 결과 실시간 구독: 누군가 투표하면 onChange가 불려요. 돌려준 함수를 부르면 구독 종료.
export function subscribeResponses(voteId, onChange) {
  if (!isOnline) {
    // 같은 브라우저의 다른 탭에서 투표했을 때도 갱신되도록
    const handler = (event) => {
      if (event.key === local.STORAGE_KEYS.responses) onChange();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }

  const channel = supabase
    .channel(`responses-${voteId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'responses', filter: `vote_id=eq.${voteId}` },
      () => onChange()
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}

// 투표의 후보 식당 정보 목록
// (예전 버전 투표는 식당 id만 저장돼 있어서, 그 경우 샘플 데이터에서 찾아요)
// 서버 데이터는 누구나 만들 수 있으니, 화면에 쓰기 전에 모양을 한 번 정리해요
export function getVoteOptions(vote, restaurants = []) {
  return vote.candidates
    .map((candidate) =>
      typeof candidate === 'string' ? restaurants.find((r) => r.id === candidate) : candidate
    )
    .filter((c) => c && c.id && c.name)
    .map((c) => ({
      id: String(c.id),
      name: String(c.name),
      rating: Number(c.rating) || 0,
      pricePerPerson: Number(c.pricePerPerson) || 0,
      area: String(c.area ?? ''),
      address: String(c.address ?? ''),
      category: String(c.category ?? ''),
    }));
}
