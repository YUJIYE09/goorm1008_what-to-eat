-- 뭐먹지? v0.2 데이터베이스 설계
-- Supabase 대시보드 → SQL Editor → New query 에 전체를 붙여넣고 Run 하세요.
-- 여러 번 실행해도 안전하도록 작성했어요.

-- 1) 투표 ------------------------------------------------------------------
create table if not exists public.votes (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 50),
  group_name  text check (char_length(group_name) <= 30),
  -- 후보 식당 정보를 투표 안에 그대로 저장해요 (다른 기기에서도 똑같이 보이도록)
  -- 예: [{"id":"r001","name":"홍대 고기집","rating":4.6,"pricePerPerson":28000,"area":"홍대","address":"..."}]
  candidates  jsonb not null check (
                jsonb_typeof(candidates) = 'array'
                and jsonb_array_length(candidates) between 2 and 20
              ),
  deadline    timestamptz not null,
  created_at  timestamptz not null default now()
);

-- 2) 투표 응답 (한 투표에서 이름 하나당 한 표) ------------------------------
create table if not exists public.responses (
  id             uuid primary key default gen_random_uuid(),
  vote_id        uuid not null references public.votes(id) on delete cascade,
  voter_name     text not null check (char_length(btrim(voter_name)) between 1 and 20),
  restaurant_id  text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (vote_id, voter_name)
);

create index if not exists responses_vote_id_idx on public.responses (vote_id);

-- 3) 투표가 열려 있고, 고른 식당이 후보에 있는지 확인하는 함수 ---------------
create or replace function public.can_respond(p_vote_id uuid, p_restaurant_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.votes v
    where v.id = p_vote_id
      and v.deadline > now()
      and exists (
        select 1 from jsonb_array_elements(v.candidates) c
        where c->>'id' = p_restaurant_id
      )
  );
$$;

-- 다시 투표하면 수정 시간 갱신
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists responses_touch on public.responses;
create trigger responses_touch before update on public.responses
  for each row execute function public.touch_updated_at();

-- 4) 보안 규칙 (Row Level Security) ----------------------------------------
-- 로그인 없이 링크만 있으면 투표를 보고 참여할 수 있어요.
-- 투표 id는 추측하기 어려운 무작위 값(uuid)이라 링크를 받은 사람만 찾을 수 있어요.
alter table public.votes enable row level security;
alter table public.responses enable row level security;

drop policy if exists "누구나 투표 보기" on public.votes;
create policy "누구나 투표 보기" on public.votes
  for select to anon, authenticated using (true);

drop policy if exists "누구나 투표 만들기" on public.votes;
create policy "누구나 투표 만들기" on public.votes
  for insert to anon, authenticated with check (deadline > now());

drop policy if exists "누구나 응답 보기" on public.responses;
create policy "누구나 응답 보기" on public.responses
  for select to anon, authenticated using (true);

drop policy if exists "마감 전 투표하기" on public.responses;
create policy "마감 전 투표하기" on public.responses
  for insert to anon, authenticated
  with check (public.can_respond(vote_id, restaurant_id));

drop policy if exists "마감 전 다시 투표하기" on public.responses;
create policy "마감 전 다시 투표하기" on public.responses
  for update to anon, authenticated
  using (public.can_respond(vote_id, restaurant_id))
  with check (public.can_respond(vote_id, restaurant_id));

-- 투표 수정·삭제, 응답 삭제는 아무도 할 수 없어요 (정책 없음 = 금지)

-- 5) 실시간 결과 (Realtime) --------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'responses'
  ) then
    alter publication supabase_realtime add table public.responses;
  end if;
end $$;
