// 앱의 시작점: CSS를 불러오고, 주소(#)에 맞는 화면을 그려요.
import './styles/reset.css';
import './styles/variables.css';
import './styles/global.css';
import './styles/components.css';
import './styles/responsive.css';

import { Header } from './components/Header.js';
import { Home } from './pages/Home.js';
import { CreateGroup, mountCreateGroup } from './pages/CreateGroup.js';
import { Recommendations, mountRecommendations } from './pages/Recommendations.js';
import { Candidates, mountCandidates } from './pages/Candidates.js';
import { Vote, mountVote } from './pages/Vote.js';
import { Results } from './pages/Results.js';
import { NotFound, ErrorPage } from './pages/Fallback.js';

// 주소별로 보여줄 화면 목록
// view: 화면 HTML을 만드는 함수
// mount: 화면이 그려진 뒤 버튼·입력 이벤트를 연결하는 함수 (필요할 때만)
// title: 브라우저 탭에 보일 화면 이름
const routes = {
  '/': { view: Home, title: '' },
  '/create': { view: CreateGroup, mount: mountCreateGroup, title: '새 모임 만들기' },
  '/recommendations': {
    view: Recommendations,
    mount: mountRecommendations,
    title: '식당 추천',
  },
  '/candidates': { view: Candidates, mount: mountCandidates, title: '최종 후보' },
  '/vote': { view: Vote, mount: mountVote, title: '투표하기' },
  '/results': { view: Results, title: '투표 결과' },
};

const notFoundRoute = { view: NotFound, title: '페이지를 찾을 수 없어요' };

const app = document.querySelector('#app');
let isFirstRender = true;

// 화면 틀(머리글 + 본문)에 내용을 채워 넣어요
function paint(content, title) {
  app.innerHTML = `
    <a href="#main" class="skip-link" id="skip-link">본문으로 건너뛰기</a>
    ${Header()}
    <main class="container" id="main" tabindex="-1">${content}</main>
  `;
  document.title = title ? `${title} | 뭐먹지?` : '뭐먹지? · 모임 식당 함께 정하기';

  // "본문으로 건너뛰기"는 주소(#)를 바꾸지 않고 본문으로 포커스만 옮겨요
  document.querySelector('#skip-link').addEventListener('click', (event) => {
    event.preventDefault();
    document.querySelector('#main').focus();
  });
}

function render() {
  // 예: "#/vote?id=v123" → path "/vote", params { id: 'v123' }
  const [path, query = ''] = (window.location.hash.slice(1) || '/').split('?');
  const params = Object.fromEntries(new URLSearchParams(query));
  const route = routes[path] ?? notFoundRoute; // 없는 주소면 안내 화면

  try {
    paint(route.view(params), route.title);
    route.mount?.(params); // mount가 있는 화면만 실행
  } catch (error) {
    // 오류가 나도 빈 화면 대신 안내를 보여줘요 (명세서 14장)
    console.error('화면을 그리다 오류가 났어요:', error);
    paint(ErrorPage(), '문제가 생겼어요');
  }

  window.scrollTo(0, 0);

  // 화면이 바뀌면 키보드·화면낭독기 사용자를 위해 새 제목으로 포커스를 옮겨요
  // (처음 열 때는 옮기지 않아요)
  if (!isFirstRender) {
    const heading = document.querySelector('main h1');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    } else {
      document.querySelector('#main').focus({ preventScroll: true });
    }
  }
  isFirstRender = false;
}

// 주소의 # 부분이 바뀔 때마다 화면을 다시 그려요
window.addEventListener('hashchange', render);
render();
