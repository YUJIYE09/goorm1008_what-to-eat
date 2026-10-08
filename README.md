# 🍽️ 뭐먹지?

모임 조건(지역, 인원, 1인 예산, 음식 종류, 분위기)을 입력하면 식당을 추천하고, 후보를 골라 다 같이 투표해서 최종 식당을 정하는 웹앱 (Vite + Vanilla JS)

## 실행 방법

```bash
npm install   # 처음 한 번만
npm run dev   # 개발 서버 실행 → http://localhost:5173
```

Windows PowerShell에서 `npm`이 막히면 `npm.cmd install`, `npm.cmd run dev`를 사용하세요.

배포용 빌드: `npm run build` (결과물은 `dist/` 폴더)

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

## 알아둘 점 (MVP의 한계)

- 데이터는 브라우저(LocalStorage)에만 저장돼요. 투표 링크를 다른 사람 기기에서 열 수 있게 하려면 Version 0.2(Supabase)가 필요해요.
- 식당은 가상의 샘플 데이터 149곳이에요. 실제 식당은 Version 0.3(식당/지도 API)에서 연결해요.
