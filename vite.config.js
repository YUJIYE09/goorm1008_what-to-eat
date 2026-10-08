import { defineConfig, loadEnv } from 'vite';
import { searchPlaces } from './server/places.js';
import { parseRequest } from './server/parse.js';

// 개발 서버(npm run dev)에서도 /api/places, /api/parse 가 동작하게 연결해요.
// (배포하면 같은 일을 api/ 폴더의 파일들이 Vercel에서 해요)
function placesApi(env) {
  return {
    name: 'places-api',
    configureServer(server) {
      server.middlewares.use('/api/places', async (req, res) => {
        const query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams);
        let result;
        try {
          result = await searchPlaces(query, env.KAKAO_REST_API_KEY);
        } catch (error) {
          console.error('식당 검색 오류:', error);
          result = { status: 500, body: { error: 'server_error' } };
        }
        res.statusCode = result.status;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(result.body));
      });

      // /api/parse: 보낸 글(JSON)을 다 읽은 뒤 AI에게 넘겨요 (v0.4)
      server.middlewares.use('/api/parse', async (req, res) => {
        let raw = '';
        for await (const chunk of req) raw += chunk;
        let result;
        try {
          result = await parseRequest(JSON.parse(raw || '{}'), env.ANTHROPIC_API_KEY);
        } catch (error) {
          console.error('AI 조건 정리 오류:', error);
          result = { status: 500, body: { error: 'server_error' } };
        }
        res.statusCode = result.status;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(result.body));
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // .env.local 의 값 읽기 ('' = VITE_ 가 없는 비밀 값도 읽어요. 서버에서만 쓰고 브라우저로 보내지 않아요)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [placesApi(env)],
    server: {
      port: 5173,
      open: true, // 개발 서버를 켜면 브라우저가 자동으로 열려요
    },
  };
});
