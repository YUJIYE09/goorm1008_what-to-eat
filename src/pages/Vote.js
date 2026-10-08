// 투표 화면: 후보 중 하나를 고르고 이름을 적어 투표해요
import { getVote, getResponses, saveResponse } from '../services/storage.js';
import { restaurants } from '../data/restaurants.js';
import { VoteCard } from '../components/VoteCard.js';
import { escapeHtml, formatDeadline } from '../utils/format.js';
import { validateVoteResponse } from '../utils/validation.js';

function isClosed(vote) {
  return new Date(vote.deadline) <= new Date();
}

export function Vote(params) {
  const vote = getVote(params.id);

  if (!vote) {
    return `
      <section class="page empty">
        <h1 class="page__title">투표를 찾을 수 없어요</h1>
        <p>후보를 2개 이상 고르고 투표를 만들어 보세요.</p>
        <a href="#/candidates" class="btn btn--primary">후보 화면으로</a>
      </section>
    `;
  }

  const options = vote.candidates
    .map((id) => restaurants.find((r) => r.id === id))
    .filter(Boolean);
  const closed = isClosed(vote);
  const count = getResponses(vote.id).length;

  return `
    <section class="page">
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
            placeholder="예: 지예" aria-describedby="voterName-error" ${closed ? 'disabled' : ''} />
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

export function mountVote(params) {
  const vote = getVote(params.id);
  const form = document.querySelector('#vote-form');
  if (!vote || !form || isClosed(vote)) return;

  form.addEventListener('submit', (event) => {
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
    const changed = saveResponse({ voteId: vote.id, voterName: name, restaurantId: values.restaurantId });
    const restaurant = restaurants.find((r) => r.id === values.restaurantId);

    document.querySelector('#vote-count').textContent = getResponses(vote.id).length;
    form.hidden = true;
    document.querySelector('#vote-done').innerHTML = `
      <div class="success">
        <p class="success__title">✅ ${escapeHtml(name)}님, 투표 완료!</p>
        <p>${changed ? '이전 선택을 바꿔서 ' : ''}<strong>${restaurant.name}</strong>에 투표했어요.</p>
        <div class="success__actions">
          <a href="#/results?id=${vote.id}" class="btn btn--primary">결과 보기</a>
          <button type="button" class="btn btn--secondary" id="vote-again">다른 사람도 투표하기</button>
        </div>
      </div>
    `;

    // 같은 기기에서 다른 사람이 이어서 투표할 수 있게 폼을 비워서 다시 보여줘요
    document.querySelector('#vote-again').addEventListener('click', () => {
      form.reset();
      form.hidden = false;
      document.querySelector('#vote-done').innerHTML = '';
      form.querySelector('[name="restaurantId"]').focus();
    });
  });
}
