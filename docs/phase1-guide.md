# Phase 1 설명서

## 1. 실행 방법

1. [Node.js](https://nodejs.org) LTS 버전을 설치합니다. (터미널에서 `node -v`가 나오면 이미 설치된 것)
2. `what-to-eat` 폴더를 내 컴퓨터로 내려받고, VS Code 같은 편집기로 엽니다.
3. 터미널에서 아래 명령을 차례로 실행합니다.

```bash
cd what-to-eat
npm install   # 처음 한 번만: Vite를 설치해요 (node_modules 폴더가 생겨요)
npm run dev   # 개발 서버 실행
```

4. 브라우저에서 `http://localhost:5173` 이 열리면 성공입니다. 파일을 저장하면 화면이 자동으로 새로고침돼요.
5. 끌 때는 터미널에서 `Ctrl + C`.

배포용 파일을 만들 때는 `npm run build` (결과물은 `dist/` 폴더, 나중에 Vercel이 이걸 사용해요).

## 2. 이번에 만든 파일

| 파일 | 하는 일 |
|---|---|
| `index.html` | 빈 `<div id="app">` 하나만 있는 뼈대. 실제 화면은 JS가 채워요 |
| `package.json` | 프로젝트 정보와 `npm run dev` 같은 명령어 목록 |
| `vite.config.js` | Vite 설정 (포트 5173, 브라우저 자동 열기) |
| `src/main.js` | 앱의 시작점. CSS를 불러오고 주소에 맞는 화면을 그림 |
| `src/components/Header.js` | 모든 화면 위에 보이는 머리글 |
| `src/pages/Home.js` | 홈 화면 |
| `src/styles/*.css` | 스타일 (아래 설명) |

`data/`, `services/`, `utils/`, `public/images/` 폴더는 구조만 만들어 두었고(빈 폴더를 유지하려고 `.gitkeep` 파일이 들어 있어요), 다음 단계에서 채웁니다.

## 3. 핵심 코드 이해하기

### 화면을 "함수"로 만들기 (`Home.js`)

```js
export function Home() {
  return `<section> ... </section>`;
}
```

화면 하나 = HTML 문자열을 돌려주는 함수 하나입니다. 백틱(`` ` ``)으로 감싸면 여러 줄 HTML을 그대로 쓸 수 있어요.

### 주소에 맞는 화면 그리기 (`main.js`)

```js
const routes = { '/': Home };

function render() {
  const path = window.location.hash.slice(1) || '/';
  const page = routes[path] ?? Home;
  app.innerHTML = `${Header()}<main>${page()}</main>`;
}

window.addEventListener('hashchange', render);
```

- 주소 끝의 `#/create` 같은 부분을 **해시(hash)** 라고 해요. 이걸 읽어서 어떤 화면을 보여줄지 정합니다.
- `routes`에 등록된 화면 함수를 실행해 `#app` 안에 넣어요.
- 해시가 바뀌면(`hashchange`) 다시 그립니다. Phase 2에서는 `routes`에 `'/create': CreateGroup` 한 줄만 추가하면 돼요.
- 지금은 `#/create` 화면이 없어서 "새 모임 만들기" 버튼을 눌러도 홈이 그대로 보이는 게 정상입니다.

### CSS 변수 (`variables.css`)

```css
:root { --color-primary: #e8590c; }
.btn--primary { background: var(--color-primary); }
```

색·간격 같은 값을 변수로 한곳에 모아두면, 변수 하나만 바꿔도 앱 전체 색이 바뀝니다.

### CSS 파일 역할 나누기

- `reset.css`: 브라우저마다 다른 기본 여백 등을 없애 통일
- `variables.css`: 디자인 값 사전
- `global.css`: 글꼴, 배경, `.container`(가운데 정렬) 등 공통 스타일
- `components.css`: 버튼, 헤더, 홈 화면 같은 부품별 스타일
- `responsive.css`: 화면이 커질 때 덮어쓰는 스타일

### 모바일 우선 (`responsive.css`)

```css
/* 기본 = 모바일 */
.btn--large { width: 100%; }

/* 768px 이상(태블릿)에서만 덮어쓰기 */
@media (min-width: 768px) {
  .btn--large { width: auto; min-width: 320px; }
}
```

작은 화면 스타일을 먼저 쓰고, 큰 화면에서 필요한 부분만 바꾸는 방식이에요.

### 접근성

- 버튼 높이는 최소 44px 이상 (`--touch-target`), 큰 버튼은 56px
- Tab 키로 이동하면 파란 테두리로 위치가 보여요 (`:focus-visible`)
- 장식용 이모지에는 `aria-hidden="true"`를 붙여 화면낭독기가 읽지 않게 했어요
