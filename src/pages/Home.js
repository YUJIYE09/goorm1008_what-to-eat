// 홈 화면: 서비스 소개 + "새 모임 만들기" 버튼 하나만 강조해요
export function Home() {
  return `
    <section class="home" aria-labelledby="home-title">
      <div class="home__emoji" aria-hidden="true">🍽️</div>
      <h1 id="home-title" class="home__title">뭐먹지?</h1>

      <p class="home__text">
        여러 명이 모이면<br />
        식당 결정이 어려우니까.
      </p>
      <p class="home__text">
        조건을 입력하고<br />
        <strong>다 같이 골라보세요.</strong>
      </p>

      <!-- Phase 2에서 #/create 화면을 만들 예정이에요 -->
      <a href="#/create" class="btn btn--primary btn--large">+ 새 모임 만들기</a>

      <ul class="home__steps" aria-label="이용 순서">
        <li><span aria-hidden="true">📝</span> 조건 입력</li>
        <li><span aria-hidden="true">🍜</span> 식당 추천</li>
        <li><span aria-hidden="true">🗳️</span> 다 같이 투표</li>
      </ul>
    </section>
  `;
}
