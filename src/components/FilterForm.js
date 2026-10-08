// 모임 조건 입력 폼의 HTML을 만들어요 (이벤트 연결은 CreateGroup.js에서)
import { AREAS, NEAR_ME, AREA_SEARCH, AREA_SEARCH_MAX, CATEGORY_LABELS, ATMOSPHERE_LABELS } from '../utils/format.js';

// 칸 아래에 보여줄 오류 메시지 자리 (처음엔 비어 있음)
function errorSlot(name) {
  return `<p class="field__error" id="${name}-error" aria-live="polite"></p>`;
}

// 동그라미 버튼(radio) 묶음을 "칩" 모양으로 만들기
function chipGroup(name, legend, labels) {
  const chips = Object.entries(labels)
    .map(
      ([value, label]) => `
        <label class="chip">
          <input type="radio" name="${name}" value="${value}" />
          <span>${label}</span>
        </label>`
    )
    .join('');

  return `
    <fieldset class="field" aria-describedby="${name}-error">
      <legend class="field__label">${legend}</legend>
      <div class="chip-group">${chips}</div>
      ${errorSlot(name)}
    </fieldset>
  `;
}

export function FilterForm() {
  const areaOptions = AREAS.map((area) => `<option value="${area}">${area}</option>`).join('');

  return `
    <form class="form" id="group-form" novalidate>
      <div class="field">
        <label class="field__label" for="name">모임 이름</label>
        <input class="input" id="name" name="name" type="text" maxlength="30"
          placeholder="예: 친구들 저녁 모임" aria-describedby="name-error" />
        ${errorSlot('name')}
      </div>

      <div class="field">
        <label class="field__label" for="area">지역</label>
        <select class="input" id="area" name="area" aria-describedby="area-error">
          <option value="">지역을 선택하세요</option>
          <option value="${NEAR_ME}">📍 내 주변 (현재 위치)</option>
          ${areaOptions}
          <option value="${AREA_SEARCH}">🔍 직접 검색 (다른 동네·역)</option>
        </select>
        <input class="input area-search" id="area-search" name="areaSearch" type="search"
          maxlength="${AREA_SEARCH_MAX}" placeholder="예: 을지로3가역, 연남동, 부산 서면"
          aria-label="검색할 동네나 역 이름" aria-describedby="area-error" hidden />
        ${errorSlot('area')}
      </div>

      <div class="field-row">
        <div class="field">
          <label class="field__label" for="people">인원수 (명)</label>
          <input class="input" id="people" name="people" type="number" inputmode="numeric"
            min="1" max="100" placeholder="예: 6" aria-describedby="people-error" />
          ${errorSlot('people')}
        </div>

        <div class="field">
          <label class="field__label" for="budget">1인 예산 (원)</label>
          <input class="input" id="budget" name="budget" type="number" inputmode="numeric"
            min="1000" max="1000000" step="1000" placeholder="예: 30000"
            aria-describedby="budget-error" />
          ${errorSlot('budget')}
        </div>
      </div>

      ${chipGroup('category', '음식 종류', CATEGORY_LABELS)}
      ${chipGroup('atmosphere', '분위기', ATMOSPHERE_LABELS)}

      <button type="submit" class="btn btn--primary btn--large">식당 추천 받기</button>
    </form>
  `;
}
