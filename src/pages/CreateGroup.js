// 모임 만들기 화면: 조건을 입력하고 검사한 뒤 저장 → 추천 화면으로 이동
import { FilterForm } from '../components/FilterForm.js';
import { validateGroup } from '../utils/validation.js';
import { formatDate, escapeHtml, NEAR_ME, CATEGORY_LABELS } from '../utils/format.js';
import { addGroup } from '../services/storage.js';
import { getMyLocation } from '../services/placeService.js';
import { parseConditions } from '../services/aiService.js';

export function CreateGroup() {
  return `
    <section class="page">
      <h1 class="page__title">새 모임 만들기</h1>
      <p class="page__desc">조건을 알려주면 딱 맞는 식당을 찾아드릴게요.</p>
      ${TalkBox()}
      ${FilterForm()}
    </section>
  `;
}

// 말로 조건 입력하기 (v0.4)
function TalkBox() {
  return `
    <form class="talk" id="talk-form" novalidate>
      <label class="field__label" for="talk">💬 말로 입력하기</label>
      <textarea class="input talk__input" id="talk" name="talk" rows="3" maxlength="300"
        placeholder="예: 6명이서 성수에서 3만원 정도로 먹고 싶고, 한 명은 고기를 못 먹어. 너무 시끄럽지 않은 곳이면 좋겠어."></textarea>
      <button type="submit" class="btn btn--secondary">✨ 아래 칸 자동으로 채우기</button>
      <div class="talk__result" id="talk-result" aria-live="polite"></div>
    </form>
    <p class="talk__divider"><span>또는 직접 입력</span></p>
  `;
}

// 정리된 조건을 아래 폼에 채워 넣어요 (사용자가 확인하고 고칠 수 있게)
function fillForm(form, conditions) {
  const setValue = (name, value) => {
    if (value !== '' && value !== undefined) form.querySelector(`[name="${name}"]`).value = value;
  };
  setValue('name', conditions.name);
  setValue('area', conditions.area);
  setValue('people', conditions.people);
  setValue('budget', conditions.budget);
  ['category', 'atmosphere'].forEach((name) => {
    const radio = form.querySelector(`[name="${name}"][value="${conditions[name]}"]`);
    if (radio) radio.checked = true;
  });
  // 못 먹는 음식은 고를 수 없게 해요
  form.querySelectorAll('[name="category"]').forEach((radio) => {
    const avoided = conditions.avoid.includes(radio.value);
    radio.disabled = avoided;
    if (avoided) radio.checked = false;
  });
  avoidList = conditions.avoid;
}

let avoidList = []; // 말로 입력할 때 "못 먹는다"고 한 음식 종류

function mountTalk(form) {
  const talkForm = document.querySelector('#talk-form');
  const result = talkForm.querySelector('#talk-result');

  talkForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = talkForm.querySelector('#talk').value.trim();
    if (!text) {
      result.innerHTML = '<p class="field__error">어떤 모임인지 한두 문장으로 적어주세요.</p>';
      return;
    }

    const button = talkForm.querySelector('button');
    button.disabled = true;
    button.textContent = '정리하는 중…';
    const { source, conditions } = await parseConditions(text);
    button.disabled = false;
    button.textContent = '✨ 아래 칸 자동으로 채우기';

    fillForm(form, conditions);

    const avoidText = conditions.avoid.length
      ? `<li>🚫 ${conditions.avoid.map((c) => CATEGORY_LABELS[c]).join(', ')} 제외</li>`
      : '';
    result.innerHTML = `
      <div class="notice notice--ok">
        <p><strong>${source === 'ai' ? '🤖 AI가 이렇게 이해했어요' : '🔎 이렇게 찾았어요'}</strong></p>
        ${conditions.notes ? `<p>${escapeHtml(conditions.notes)}</p>` : ''}
        ${avoidText ? `<ul>${avoidText}</ul>` : ''}
        <p class="hint">아래 칸을 확인하고, 빈 칸이나 틀린 곳만 고친 뒤 "식당 추천 받기"를 눌러주세요.</p>
      </div>`;

    // 비어 있는 첫 칸으로 이동 (없으면 추천 버튼으로)
    const empty = ['name', 'area', 'people', 'budget'].find(
      (name) => !form.querySelector(`[name="${name}"]`).value
    );
    (empty ? form.querySelector(`[name="${empty}"]`) : form.querySelector('[type="submit"]')).focus();
  });
}

// 화면이 그려진 뒤 실행: "제출" 이벤트를 연결해요
export function mountCreateGroup() {
  const form = document.querySelector('#group-form');
  avoidList = [];
  mountTalk(form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault(); // 페이지가 새로고침되지 않게 막기

    // 폼에 입력된 값 모으기
    const formData = new FormData(form);
    const values = {
      name: formData.get('name') ?? '',
      area: formData.get('area') ?? '',
      people: formData.get('people') ?? '',
      budget: formData.get('budget') ?? '',
      category: formData.get('category') ?? '',
      atmosphere: formData.get('atmosphere') ?? '',
    };

    const errors = validateGroup(values);
    showErrors(form, errors);

    // 오류가 하나라도 있으면 여기서 멈춰요 (제출하지 않음)
    if (Object.keys(errors).length > 0) return;

    const group = {
      id: `g${Date.now()}`,
      name: values.name.trim(),
      area: values.area,
      people: Number(values.people),
      budget: Number(values.budget),
      category: values.category,
      atmosphere: values.atmosphere,
      createdAt: formatDate(),
      avoid: avoidList.filter((c) => c !== values.category), // 못 먹는 음식 (v0.4)
    };

    // "내 주변"이면 현재 위치를 물어봐요 (브라우저가 허락 창을 띄워요)
    if (group.area === NEAR_ME) {
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      try {
        const { lat, lng } = await getMyLocation();
        group.lat = lat;
        group.lng = lng;
      } catch {
        showErrors(form, {
          area: '현재 위치를 가져오지 못했어요. 위치 권한을 허용하거나 지역을 직접 골라주세요.',
        });
        return;
      } finally {
        submitButton.disabled = false;
      }
    }

    // 기존 모임 목록 뒤에 새 모임을 추가해서 저장
    addGroup(group);

    window.location.hash = '/recommendations';
  });
}

// 각 칸 아래에 오류 메시지를 보여주고, 첫 번째 오류 칸으로 이동해요
function showErrors(form, errors) {
  const fields = ['name', 'area', 'people', 'budget', 'category', 'atmosphere'];

  fields.forEach((field) => {
    const message = errors[field] ?? '';
    form.querySelector(`#${field}-error`).textContent = message;
    form.querySelectorAll(`[name="${field}"]`).forEach((input) => {
      input.setAttribute('aria-invalid', message ? 'true' : 'false');
    });
  });

  const firstError = fields.find((field) => errors[field]);
  if (firstError) {
    form.querySelector(`[name="${firstError}"]`).focus();
  }
}
