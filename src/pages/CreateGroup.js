// 모임 만들기 화면: 조건을 입력하고 검사한 뒤 저장 → 추천 화면으로 이동
import { FilterForm } from '../components/FilterForm.js';
import { validateGroup } from '../utils/validation.js';
import { formatDate, NEAR_ME } from '../utils/format.js';
import { addGroup } from '../services/storage.js';
import { getMyLocation } from '../services/placeService.js';

export function CreateGroup() {
  return `
    <section class="page">
      <h1 class="page__title">새 모임 만들기</h1>
      <p class="page__desc">조건을 알려주면 딱 맞는 식당을 찾아드릴게요.</p>
      ${FilterForm()}
    </section>
  `;
}

// 화면이 그려진 뒤 실행: "제출" 이벤트를 연결해요
export function mountCreateGroup() {
  const form = document.querySelector('#group-form');

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
