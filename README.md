# 🍽️ 뭐먹지?

모임 조건(지역, 인원, 1인 예산, 음식 종류, 분위기)을 입력하면 식당을 추천하고, 후보를 골라 다 같이 투표해서 최종 식당을 정하는 웹앱 (Vite + Vanilla JS)

## 실행 방법

```bash
npm install   # 처음 한 번만
npm run dev   # 개발 서버 실행 → http://localhost:5173
```

Windows PowerShell에서 `npm`이 막히면 `npm.cmd install`, `npm.cmd run dev`를 사용하세요.

배포용 빌드: `npm run build` (결과물은 `dist/` 폴더)

## 서버 연결 (v0.2, 선택)

친구들이 각자 휴대폰에서 투표하려면 Supabase 연결이 필요해요. 자세한 방법은 `docs/v0.2-guide.md`.

1. Supabase SQL Editor에서 `supabase/schema.sql` 실행
2. `.env.example`을 복사해 `.env.local`을 만들고 URL과 anon 키 입력
3. Vercel에도 같은 환경 변수 입력 후 Redeploy

키가 없으면 예전처럼 이 브라우저(LocalStorage)에만 저장하는 모드로 동작해요.

## Vercel 배포

1. 이 폴더를 GitHub 저장소에 올리기
2. vercel.com → Add New Project → 저장소 선택
3. Framework Preset: **Vite** (자동 인식), Build Command `npm run build`, Output `dist`
4. Deploy

## 진행 상황

- [x] Phase 1: 프로젝트 세팅, 폴더 구조, Home, 기본 CSS
- [x] Phase 2: Create Group, Form validation
- [x] Phase 3: Restaurant sample data, Restaurant Card, Filtering
- [x] Phase 4: Recommendation scoring, Sorting
- [x] Phase 5: Candidate management, LocalStorage
- [x] Phase 6: Vote creation, Vote page
- [x] Phase 7: Vote result, Ranking, Tie handling
- [x] Phase 8: Responsive polish, Loading, Empty / Error state, Accessibility

단계별 코드 설명은 `docs/phase1-guide.md` ~ `docs/phase8-guide.md`에 있어요.

## 확장 진행 상황

- [x] v0.2: 투표 링크 공유, 실시간 결과 (Supabase)
- [ ] v0.3: 실제 식당 검색 (카카오 로컬 API)
- [ ] v0.4: AI 자연어 조건 입력

## 알아둘 점

- 식당은 아직 가상의 샘플 데이터 149곳이에요. 실제 식당은 v0.3에서 연결해요.
- 로그인이 없어서 투표자는 이름으로만 구분해요.
