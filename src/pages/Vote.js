// 투표 화면: 후보 중 하나를 고르고 이름을 적어 투표해요
// v0.2: 서버에서 투표를 불러오므로 화면 함수가 async(비동기)예요.
import {
  getVote,
  getResponses,
  saveResponse,
  getVoteOptions,
  isOnline,
} from '../services/voteService.js';
import { getData, saveData } from '../services/storage.js';
import { restaurants } from '../data/restaurants.js';
import { VoteCard } from '../components/VoteCard.js';
import { escapeHtml, formatDeadline } from '../utils/format.js';
import { validateVoteResponse } from '../utils/validation.js';

const MY_NAME_KEY = 'whatToEat_myName'; // 내 이름 기억하기 (다음에 자동 입력)

let current = null; // 지금 보고 있는 투표 (view에서 불러와 mount에서 사용)

function isClosed(vote) {
  return new Date(vote.deadline) <= new Date();
}

export async function Vote(params) {
  const vote = await getVote(params.id);
  current = vote;

  if (!vote) {
    return `
      <section class="page empty">
        <h1 class="page__title">투표를 찾을 수 없어요</h1>
        <p>링크가 잘못됐거나 삭제된 투표예요. 링크를 보낸 사람에게 다시 확인해 주세요.</p>
        <a href="#/" class="btn btn--primary">홈으로 가기</a>
      </section>
    `;
  }

  const options = getVoteOptions(vote, restaurants);
  const closed = isClosed(vote);
  const count = (await getResponses(vote.id)).length;
  const myName = getData(MY_NAME_KEY, '');

  return `
    <section class="page">
      ${vote.groupName ? `<p class="page__desc">${escapeHtml(vote.groupName)}</p>` : ''}
      <h1 class="page__title"><span aria-hidden="true">🍽️</span> ${escapeHtml(vote.title)}</h1>
      <p class="page__desc">
        마감 ${formatDeadline(vote.deadline)} · 지금까지 <strong id="vote-count">${count}</strong>명 투표
        · <a href="#/results?id=${vote.id}" class="link">결과 보기</a>
      </p>

      ${
        closed
          ? `<p class="notice">⏰ 마감된 투표예요. 더 이상 투표할 수 없어요.
               <a href="#/results?id=${vote.id}" class="link">결과 보기</a></p>`
          : ''
      }

      <form class="form" id="vote-form" novalidate>
        <fieldset class="field" ${closed ? 'disabled' : ''}>
          <legend class="field__label vote-question">어디가 가장 좋아요?</legend>
          <div class="vote-options">${options.map(VoteCard).join('')}</div>
          <p class="field__error" id="restaurantId-error" aria-live="polite"></p>
        </fieldset>

        <div class="field">
          <label class="field__label" for="voterName">이름</label>
          <input class="input" id="voterName" name="voterName" type="text" maxlength="20"
            placeholder="예: 지예" value="${escapeHtml(myName ?? '')}"
            aria-describedby="voterName-error" ${closed ? 'disabled' : ''} />
          <p class="field__error" id="voterName-error" aria-live="polite"></p>
        </div>

        <button type="submit" class="btn btn--primary btn--large" ${closed ? 'disabled' : ''}>
          투표하기
        </button>
      </form>

      <div id="vote-done" aria-live="polite"></div>
    </section>
  `;
}

export function mountVote() {
  const vote = current;
  const form = document.querySelector('#vote-form');
  if (!vote || !form || isClosed(vote)) return;

  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = {
      voterName: form.querySelector('#voterName').value,
      restaurantId: form.querySelector('[name="restaurantId"]:checked')?.value ?? '',
    };

    const errors = validateVoteResponse(values);
    form.querySelector('#voterName-error').textContent = errors.voterName ?? '';
    form.querySelector('#restaurantId-error').textContent = errors.restaurantId ?? '';
    form.querySelector('#voterName').setAttribute('aria-invalid', String(Boolean(errors.voterName)));

    if (errors.restaurantId) {
      form.querySelector('[name="restaurantId"]').focus();
      return;
    }
    if (errors.voterName) {
      form.querySelector('#voterName').focus();
      return;
    }

    const name = values.voterName.trim();
    submitButton.disabled = true;
    submitButton.textContent = '투표하는 중…';

    let changed;
    try {
      changed = await saveResponse({
        voteId: vote.id,
        voterName: name,
        restaurantId: values.restaurantId,
      });
    } catch (error) {
      console.error('투표 저장 실패:', error);
      form.querySelector('#restaurantId-error').textContent = isClosed(vote)
        ? '방금 투표가 마감됐어요.'
        : '투표를 저장하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.';
      submitButton.disabled = false;
      submitButton.textContent = '투표하기';
      return;
    }

    saveData(MY_NAME_KEY, name);
    const restaurant = getVoteOptions(vote, restaurants).find((r) => r.id === values.restaurantId);
    document.querySelector('#vote-count').textContent = (await getResponses(vote.id)).length;

    form.hidden = true;
    submitButton.disabled = false;
    submitButton.textContent = '투표하기';
    document.querySelector('#vote-done').innerHTML = `
      <div class="success">
        <p class="success__title">✅ ${escapeHtml(name)}님, 투표 완료!</p>
        <p>${changed ? '이전 선택을 바꿔서 ' : ''}<strong>${escapeHtml(restaurant.name)}</strong>에 투표했어요.</p>
        <div class="success__actions">
          <a href="#/results?id=${vote.id}" class="btn btn--primary">결과 보기</a>
          <button type="button" class="btn btn--secondary" id="vote-again">
            ${isOnline ? '선택 바꾸기' : '다른 사람도 투표하기'}
          </button>
        </div>
      </div>
    `;

    // 서버 연결 모드: 내 선택 바꾸기 / 로컬 모드: 같은 기기에서 다른 사람이 이어서 투표
    document.querySelector('#vote-again').addEventListener('click', () => {
      form.reset();
      if (isOnline) form.querySelector('#voterName').value = name;
      form.hidden = false;
      document.querySelector('#vote-done').innerHTML = '';
      form.querySelector('[name="restaurantId"]').focus();
    });
  });
}
