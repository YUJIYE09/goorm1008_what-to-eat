// 모든 화면 위쪽에 보이는 머리글
export function Header() {
  return `
    <header class="header">
      <div class="container header__inner">
        <a href="#/" class="header__logo" aria-label="뭐먹지? 홈으로">
          <span aria-hidden="true">🍽️</span> 뭐먹지?
        </a>
      </div>
    </header>
  `;
}
