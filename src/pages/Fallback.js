// 예외 상황 화면 모음: 없는 주소, 오류

// 주소가 잘못됐을 때
export function NotFound() {
  return `
    <section class="page empty">
      <p class="empty__emoji" aria-hidden="true">🧭</p>
      <h1 class="page__title">페이지를 찾을 수 없어요</h1>
      <p>주소가 바뀌었거나 없는 페이지예요.</p>
      <a href="#/" class="btn btn--primary">홈으로 가기</a>
    </section>
  `;
}

// 화면을 그리다 오류가 났을 때
export function ErrorPage() {
  return `
    <section class="page empty" role="alert">
      <p class="empty__emoji" aria-hidden="true">😵</p>
      <h1 class="page__title">문제가 생겼어요</h1>
      <p>잠시 후 다시 시도해 주세요. 계속 안 되면 홈에서 다시 시작해 보세요.</p>
      <div class="success__actions">
        <button type="button" class="btn btn--primary" onclick="location.reload()">다시 시도</button>
        <a href="#/" class="btn btn--secondary">홈으로 가기</a>
      </div>
    </section>
  `;
}
