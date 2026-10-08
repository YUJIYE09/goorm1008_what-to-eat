// Supabase 연결 (v0.2)
// .env.local(또는 Vercel 환경 변수)에 URL과 anon 키가 있으면 연결하고,
// 없으면 null → 지금처럼 이 브라우저(LocalStorage)에만 저장하는 모드로 동작해요.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

// 서버에 연결된 상태인지 (true면 링크로 다른 기기에서도 투표 가능)
export const isOnline = Boolean(supabase);
