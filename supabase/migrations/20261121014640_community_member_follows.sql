-- Private member following. This does not subscribe anyone to email.
create table public.member_follows (
  follower_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  constraint member_follows_no_self check (follower_id <> followed_id)
);
create index member_follows_followed_idx on public.member_follows(followed_id);
alter table public.member_follows enable row level security;

create policy member_follows_read on public.member_follows for select to authenticated
  using (follower_id = (select auth.uid()));
create policy member_follows_create on public.member_follows for insert to authenticated
  with check (follower_id = (select auth.uid()) and (select private.is_member()));
create policy member_follows_delete on public.member_follows for delete to authenticated
  using (follower_id = (select auth.uid()));

-- The caller locks its own profile row, serializing concurrent insert attempts
-- before counting. NO KEY UPDATE also permits foreign-key checks when two
-- members follow each other concurrently. SECURITY INVOKER preserves RLS.
create function private.guard_member_follow() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.follower_id is distinct from auth.uid() or not private.is_member() then
    raise exception 'verified_account_required' using errcode = '42501';
  end if;
  perform id from public.profiles where id = new.follower_id for no key update;
  -- ON CONFLICT DO NOTHING stays idempotent, including at the account cap.
  if exists (select 1 from public.member_follows where follower_id = new.follower_id and followed_id = new.followed_id) then
    return new;
  end if;
  if (select count(*) from public.member_follows where follower_id = new.follower_id) >= 200 then
    raise exception 'follow_limit_reached' using errcode = 'P0001';
  end if;
  perform private.consume_limit('follow_create',240,3600);
  return new;
end;
$$;
revoke all on function private.guard_member_follow() from public, anon, authenticated;
create trigger member_follows_guard before insert on public.member_follows
  for each row execute function private.guard_member_follow();

revoke all on public.member_follows from public, anon, authenticated;
-- Anonymous SELECT permits a zero-row capability probe; no anon RLS policy
-- exists, so neither the graph nor counts are visible publicly.
grant select on public.member_follows to anon, authenticated;
grant insert(follower_id,followed_id), delete on public.member_follows to authenticated;
