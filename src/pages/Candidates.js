// 후보 화면: 담은 식당을 확인하고 삭제, 2개 이상이면 투표 만들기
import {
  getCurrentGroup,
  getCandidateIds,
  removeCandidate,
  createVote,
} from '../services/storage.js';
import { restaurants } from '../data/restaurants.js';
import { CandidateList } from '../components/CandidateList.js';
import { escapeHtml, toDateTimeLocal } from '../utils/format.js';
import { validateVote } from '../utils/validation.js';

const MIN_CANDIDATES = 2; // 투표를 만들 수 있는 최소 후보 수

export function Candidates() {
  const group = getCurrentGroup();

  if (!group) {
    return `
      <section class="page empty">
        <h1 class="page__title">아직 만든 모임이 없어요</h1>
        <p>조건을 입력하면 식당을 추천해 드려요.</p>
        <a href="#/create" class="btn btn--primary">+ 새 모임 만들기</a>
      </section>
    `;
  }

  // 저장된 id로 식당 정보 찾기
  const candidates = getCandidateIds(group.id)
    .map((id) => restaurants.find((r) => r.id === id))
    .filter(Boolean); // 혹시 없는 식당 id가 있으면 빼기

  if (candidates.length === 0) {
    return `
      <section class="page">
        <h1 class="page__title">최종 후보</h1>
        <div class="empty">
          <p><strong>아직 선택한 식당이 없어요.</strong></p>
          <p>마음에 드는 식당을 후보에 추가해보세요.</p>
          <a href="#/recommendations" class="btn btn--primary">추천 식당 보러 가기</a>
        </div>
      </section>
    `;
  }

  const canVote = candidates.length >= MIN_CANDIDATES;

  return `
    <section class="page">
      <p class="page__desc">${escapeHtml(group.name)}</p>
      <h1 class="page__title">최종 후보 ${candidates.length}개</h1>

      ${CandidateList(candidates)}

      <a href="#/recommendations" class="link add-more">+ 식당 더 고르기</a>

      <div class="page__actions">
        <button type="button" class="btn btn--primary btn--large" id="create-vote"
          ${canVote ? '' : 'disabled aria-describedby="vote-hint"'}>
          투표 만들기
        </button>
        <p class="hint" id="vote-hint" aria-live="polite">
          ${canVote ? '' : `투표를 만들려면 후보를 ${MIN_CANDIDATES}개 이상 골라주세요.`}
        </p>
      </div>

      ${canVote ? VoteForm(group) : ''}
      <div id="vote-created" aria-live="polite"></div>
    </section>
  `;
}

// 투표 만들기 폼 (처음엔 숨겨져 있다가 "투표 만들기"를 누르면 보여요)
function VoteForm(group) {
  // 기본 마감 시간: 오늘 밤 23:59 (이미 지났으면 내일 23:59)
  const deadline = new Date();
  deadline.setHours(23, 59, 0, 0);
  if (deadline <= new Date()) deadline.setDate(deadline.getDate() + 1);

  return `
    <form class="form vote-form" id="vote-form" novalidate hidden>
      <h2 class="section-title">투표 만들기</h2>
      <div class="field">
        <label class="field__label" for="title">투표 제목</label>
        <input class="input" id="title" name="title" type="text" maxlength="50"
          value="${escapeHtml(group.name)} 식당 투표" aria-describedby="title-error" />
        <p class="field__error" id="title-error" aria-live="polite"></p>
      </div>
      <div class="field">
        <label class="field__label" for="deadline">마감 시간</label>
        <input class="input" id="deadline" name="deadline" type="datetime-local"
          value="${toDateTimeLocal(deadline)}" aria-describedby="deadline-error" />
        <p class="field__error" id="deadline-error" aria-live="polite"></p>
      </div>
      <button type="submit" class="btn btn--primary btn--large">투표 시작하기</button>
    </form>
  `;
}

// 투표가 만들어진 뒤 보여줄 안내 (명세서 9.5)
function VoteCreated(vote) {
  return `
    <div class="success">
      <p class="success__title">🎉 투표가 만들어졌어요!</p>
      <div class="success__actions">
        <a href="#/vote?id=${vote.id}" class="btn btn--primary">투표 페이지 보기</a>
        <button type="button" class="btn btn--secondary" id="copy-link">링크 복사</button>
      </div>
      <p class="hint" id="copy-result" aria-live="polite"></p>
    </div>
  `;
}

export function mountCandidates() {
  const group = getCurrentGroup();
  if (!group) return;

  // 삭제 버튼: 저장소에서 지우고 화면을 다시 그려요
  document.querySelectorAll('[data-remove-id]').forEach((button) => {
    button.addEventListener('click', () => {
      removeCandidate(group.id, button.dataset.removeId);
      window.dispatchEvent(new HashChangeEvent('hashchange')); // 현재 화면 다시 그리기
    });
  });

  const form = document.querySelector('#vote-form');
  if (!form) return; // 후보가 2개 미만이면 폼이 없어요

  // "투표 만들기" → 폼 보여주기
  document.querySelector('#create-vote').addEventListener('click', (event) => {
    event.currentTarget.hidden = true;
    form.hidden = false;
    form.querySelector('#title').focus();
  });

  // "투표 시작하기" → 검사 → 저장 → 완료 안내
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = {
      title: form.querySelector('#title').value,
      deadline: form.querySelector('#deadline').value,
    };

    const errors = validateVote(values);
    ['title', 'deadline'].forEach((field) => {
      form.querySelector(`#${field}-error`).textContent = errors[field] ?? '';
      form.querySelector(`#${field}`).setAttribute('aria-invalid', String(Boolean(errors[field])));
    });
    if (Object.keys(errors).length > 0) {
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }

    const vote = createVote({
      groupId: group.id,
      title: values.title.trim(),
      candidates: getCandidateIds(group.id),
      deadline: values.deadline,
    });

    form.hidden = true;
    document.querySelector('#vote-created').innerHTML = VoteCreated(vote);
    document.querySelector('#copy-link').addEventListener('click', () => copyVoteLink(vote.id));
  });
}

// 투표 링크를 클립보드에 복사
async function copyVoteLink(voteId) {
  const url = `${window.location.origin}${window.location.pathname}#/vote?id=${voteId}`;
  const result = document.querySelector('#copy-result');
  try {
    await navigator.clipboard.writeText(url);
    result.textContent = '링크를 복사했어요! (지금은 이 브라우저에서만 열려요)';
  } catch {
    // 클립보드를 쓸 수 없는 환경이면 링크를 직접 보여줘요
    result.textContent = `이 링크를 복사해 주세요: ${url}`;
  }
}
