// 후보 화면: 담은 식당을 확인하고 삭제, 2개 이상이면 투표 만들기
import { getCurrentGroup, getCandidates, removeCandidate } from '../services/storage.js';
import { createVote, isOnline } from '../services/voteService.js';
import { restaurants } from '../data/restaurants.js';
import { CandidateList } from '../components/CandidateList.js';
import { escapeHtml, toDateTimeLocal, formatDeadline } from '../utils/format.js';
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

  // 담아 둔 식당 정보 (예전에 id만 저장했으면 샘플 데이터에서 찾아요)
  const candidates = getCandidates(group.id, restaurants);

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
      <p>${
        isOnline
          ? '링크를 단체방에 보내면 친구들이 각자 휴대폰에서 투표할 수 있어요.'
          : '지금은 이 브라우저에서만 투표할 수 있어요. (서버 연결 전)'
      }</p>
      <div class="success__actions">
        <a href="#/vote?id=${vote.id}" class="btn btn--primary">투표 페이지 보기</a>
        <button type="button" class="btn btn--secondary" id="copy-link">링크 복사</button>
        ${
          isOnline && navigator.share
            ? '<button type="button" class="btn btn--secondary" id="share-link">공유하기</button>'
            : ''
        }
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
  form.addEventListener('submit', async (event) => {
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

    // 서버에 저장하는 동안 버튼을 잠가서 두 번 눌리지 않게
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = '만드는 중…';

    let vote;
    try {
      vote = await createVote({
        groupId: group.id,
        groupName: group.name,
        title: values.title.trim(),
        candidates: getCandidates(group.id, restaurants),
        deadline: values.deadline,
      });
    } catch (error) {
      console.error('투표 만들기 실패:', error);
      form.querySelector('#deadline-error').textContent =
        '투표를 만들지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.';
      submitButton.disabled = false;
      submitButton.textContent = '투표 시작하기';
      return;
    }

    form.hidden = true;
    document.querySelector('#vote-created').innerHTML = VoteCreated(vote);
    document.querySelector('#copy-link').addEventListener('click', () => copyVoteLink(vote.id));
    document
      .querySelector('#share-link')
      ?.addEventListener('click', () => shareVoteLink(vote));
  });
}

// 투표 링크 주소 만들기
function voteUrl(voteId) {
  return `${window.location.origin}${window.location.pathname}#/vote?id=${voteId}`;
}

// 공유할 때 함께 보낼 글 (후보 이름과 마감 시간을 보여줘서 열기 전에도 알 수 있게)
function shareText(vote) {
  const names = (vote.candidates ?? []).map((c) => `· ${c.name}`).join('\n');
  return `🍽️ ${vote.title}\n${names}\n⏰ ${formatDeadline(vote.deadline)}까지 투표해 주세요!`;
}

// 휴대폰 공유 창 열기 (카카오톡, 문자 등으로 바로 보내기)
async function shareVoteLink(vote) {
  try {
    await navigator.share({
      title: vote.title,
      text: shareText(vote),
      url: voteUrl(vote.id),
    });
  } catch {
    // 사용자가 공유 창을 닫은 경우 등은 조용히 넘어가요
  }
}

// 투표 링크를 클립보드에 복사
async function copyVoteLink(voteId) {
  const url = voteUrl(voteId);
  const result = document.querySelector('#copy-result');
  try {
    await navigator.clipboard.writeText(url);
    result.textContent = isOnline
      ? '링크를 복사했어요! 단체방에 붙여넣어 보내세요.'
      : '링크를 복사했어요! (서버 연결 전이라 이 브라우저에서만 열려요)';
  } catch {
    // 클립보드를 쓸 수 없는 환경이면 링크를 직접 보여줘요
    result.textContent = `이 링크를 복사해 주세요: ${url}`;
  }
}
