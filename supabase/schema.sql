-- Source schema. Applied by the generated, versioned migration.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, anon;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null check (char_length(display_name) between 1 and 60),
  bio text not null default '' check (char_length(bio) <= 500),
  city text not null default '' check (char_length(city) <= 80),
  workplace text not null default '' check (char_length(workplace) <= 120),
  country_code text not null default 'PS' check (country_code ~ '^[A-Z]{2}$'),
  avatar_path text check (avatar_path is null or (split_part(avatar_path, '/', 1) = id::text and char_length(avatar_path) <= 200)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.beverage_categories (
  id text primary key check (id ~ '^[a-z][a-z0-9-]{1,39}$'),
  name_ar text not null,
  name_en text not null
);
insert into public.beverage_categories values ('coffee', 'قهوة', 'Coffee');
create table public.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null check (role in ('moderator', 'admin')),
  granted_at timestamptz not null default now()
);
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 120),
  description text not null default '' check (char_length(description) <= 3000),
  category_id text not null references public.beverage_categories(id),
  method text not null default '' check (char_length(method) <= 80),
  beans text not null default '' check (char_length(beans) <= 150),
  roaster text not null default '' check (char_length(roaster) <= 120),
  tasting_notes text not null default '' check (char_length(tasting_notes) <= 1000),
  dose_g numeric check (dose_g > 0 and dose_g <= 1000),
  water_g numeric check (water_g > 0 and water_g <= 20000),
  yield_g numeric check (yield_g > 0 and yield_g <= 20000),
  temperature_c numeric check (temperature_c >= 0 and temperature_c <= 100),
  time_seconds integer check (time_seconds > 0 and time_seconds <= 172800),
  grind text not null default '' check (char_length(grind) <= 120),
  language_code text not null default 'ar' check (language_code ~ '^[a-z]{2}$'),
  country_code text not null default 'PS' check (country_code ~ '^[A-Z]{2}$'),
  status text not null default 'draft' check (status in ('draft','published')),
  hidden_at timestamptz,
  version integer not null default 1 check (version > 0),
  search_document tsvector generated always as (to_tsvector('simple', title || ' ' || description || ' ' || beans)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index recipes_owner_idx on public.recipes(owner_id, created_at desc);
create index recipes_explore_idx on public.recipes(category_id, created_at desc, id) where status = 'published' and hidden_at is null;
create index recipes_method_idx on public.recipes(method) where status = 'published' and hidden_at is null;
create index recipes_search_idx on public.recipes using gin (search_document);

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  position integer not null check (position between 1 and 30),
  name text not null check (char_length(trim(name)) between 1 and 100),
  quantity numeric check (quantity > 0 and quantity <= 100000),
  unit text not null default '' check (char_length(unit) <= 30),
  unique(recipe_id, position)
);
create table public.recipe_steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  position integer not null check (position between 1 and 30),
  instruction text not null check (char_length(trim(instruction)) between 1 and 2000),
  unique(recipe_id, position)
);
create table public.recipe_images (
  recipe_id uuid primary key references public.recipes(id) on delete cascade,
  object_path text not null unique check (char_length(object_path) <= 200),
  alt_text text not null default '' check (char_length(alt_text) <= 200)
);
create table public.bookmarks (
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, recipe_id)
);
create index bookmarks_recipe_idx on public.bookmarks(recipe_id);
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  hidden_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index comments_recipe_idx on public.comments(recipe_id, created_at);
create index comments_author_idx on public.comments(author_id);
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  recipe_id uuid references public.recipes(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null check (char_length(trim(reason)) between 5 and 1000),
  status text not null default 'pending' check (status in ('pending','dismissed','actioned')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (num_nonnulls(recipe_id, comment_id) = 1)
);
create unique index reports_unique_recipe on public.reports(reporter_id, recipe_id) where recipe_id is not null;
create unique index reports_unique_comment on public.reports(reporter_id, comment_id) where comment_id is not null;
create index reports_recipe_idx on public.reports(recipe_id);
create index reports_comment_idx on public.reports(comment_id);
create index reports_queue_idx on public.reports(status, created_at);
create index reports_reviewer_idx on public.reports(reviewed_by);
create table public.moderation_actions (
  id bigint generated always as identity primary key,
  moderator_id uuid references public.profiles(id) on delete set null,
  report_id uuid references public.reports(id) on delete set null,
  decision text not null,
  created_at timestamptz not null default now()
);
create index moderation_actions_report_idx on public.moderation_actions(report_id);
create index moderation_actions_moderator_idx on public.moderation_actions(moderator_id);
create table private.rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  started_at timestamptz not null,
  attempts integer not null,
  primary key(user_id, action)
);
alter table private.rate_limits enable row level security;

create function private.is_member() returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (select 1 from auth.users where id = auth.uid() and email_confirmed_at is not null);
$$;
create function private.is_moderator() returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('moderator','admin'));
$$;
create function private.can_read_recipe(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.recipes r where r.id = target and (
    (r.status = 'published' and r.hidden_at is null) or r.owner_id = auth.uid()
    or (private.is_moderator() and exists (
      select 1 from public.reports p left join public.comments c on c.id = p.comment_id
      where p.recipe_id = r.id or c.recipe_id = r.id
    ))
  ));
$$;
create function private.owns_recipe(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select private.is_member() and exists (select 1 from public.recipes where id = target and owner_id = auth.uid() and hidden_at is null);
$$;
create function private.is_public_recipe(target uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.recipes where id = target and status = 'published' and hidden_at is null);
$$;
create function private.consume_limit(action_name text, max_count integer, window_seconds integer) returns void language plpgsql security definer set search_path = '' as $$
declare current_count integer;
begin
  if not private.is_member() then raise exception 'verified_account_required' using errcode = '42501'; end if;
  insert into private.rate_limits(user_id, action, started_at, attempts)
  values (auth.uid(), action_name, now(), 1)
  on conflict (user_id, action) do update set
    started_at = case when rate_limits.started_at < now() - make_interval(secs => window_seconds) then now() else rate_limits.started_at end,
    attempts = case when rate_limits.started_at < now() - make_interval(secs => window_seconds) then 1 else rate_limits.attempts + 1 end
  returning attempts into current_count;
  if current_count > max_count then raise exception 'rate_limit_exceeded' using errcode = 'P0001'; end if;
end;
$$;

create function private.new_profile() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, username, display_name)
  values (new.id, 'u_' || replace(new.id::text, '-', '' )::varchar(24), 'عضو جديد');
  return new;
end;
$$;
create trigger create_profile after insert on auth.users for each row execute function private.new_profile();
-- Existing accounts receive the same private-by-default profile without copying metadata.
insert into public.profiles(id,username,display_name)
select id,'u_' || replace(id::text,'-','')::varchar(24),'عضو جديد' from auth.users
on conflict (id) do nothing;

create function private.guard_content() returns trigger language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'INSERT' then
    if TG_TABLE_NAME in ('recipes','comments') and new.hidden_at is not null then raise exception 'moderation_protected' using errcode = '42501'; end if;
    if TG_TABLE_NAME = 'recipes' then
      new.created_at := now(); new.updated_at := now(); new.version := 1;
      perform private.consume_limit('recipe_create', 20, 86400);
    elsif TG_TABLE_NAME = 'comments' then
      new.created_at := now(); new.updated_at := now();
      perform private.consume_limit('comment_create', 30, 3600);
    end if;
    return new;
  end if;
  if new.id <> old.id or new.created_at <> old.created_at then raise exception 'immutable_field' using errcode = '42501'; end if;
  if TG_TABLE_NAME = 'profiles' then
    perform private.consume_limit('profile_edit', 30, 3600);
  else
    if (TG_TABLE_NAME = 'recipes' and to_jsonb(new)->>'owner_id' <> to_jsonb(old)->>'owner_id')
      or (TG_TABLE_NAME = 'comments' and (to_jsonb(new)->>'author_id' <> to_jsonb(old)->>'author_id' or to_jsonb(new)->>'recipe_id' <> to_jsonb(old)->>'recipe_id')) then
      raise exception 'immutable_owner' using errcode = '42501';
    end if;
    if new.hidden_at is distinct from old.hidden_at and not private.is_moderator() then raise exception 'moderation_protected' using errcode = '42501'; end if;
    if (to_jsonb(new) - array['hidden_at','updated_at','version','search_document']) is distinct from (to_jsonb(old) - array['hidden_at','updated_at','version','search_document']) then
      if coalesce(to_jsonb(old)->>'owner_id', to_jsonb(old)->>'author_id') <> auth.uid()::text or old.hidden_at is not null then
        raise exception 'content_edit_forbidden' using errcode = '42501';
      end if;
      perform private.consume_limit(TG_TABLE_NAME || '_edit', 60, 3600);
    end if;
    if TG_TABLE_NAME = 'recipes' then new.version := old.version + 1; end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_guard before update on public.profiles for each row execute function private.guard_content();
create trigger recipes_guard before insert or update on public.recipes for each row execute function private.guard_content();
create trigger comments_guard before insert or update on public.comments for each row execute function private.guard_content();

create function private.guard_interaction() returns trigger language plpgsql set search_path = '' as $$
begin
  new.created_at := now();
  if TG_TABLE_NAME = 'reports' then
    if new.status <> 'pending' or new.reviewed_by is not null or new.reviewed_at is not null then raise exception 'moderation_protected' using errcode = '42501'; end if;
    perform private.consume_limit('report_create', 10, 86400);
  else
    perform private.consume_limit('bookmark_create', 120, 3600);
  end if;
  return new;
end;
$$;
create trigger reports_guard before insert on public.reports for each row execute function private.guard_interaction();
create trigger bookmarks_guard before insert on public.bookmarks for each row execute function private.guard_interaction();

create function private.guard_report_review() returns trigger language plpgsql set search_path = '' as $$
begin
  if not private.is_moderator() or
    (to_jsonb(new) - array['status','reviewed_by','reviewed_at']) is distinct from (to_jsonb(old) - array['status','reviewed_by','reviewed_at']) then
    raise exception 'review_forbidden' using errcode = '42501';
  end if;
  new.reviewed_by := auth.uid(); new.reviewed_at := now();
  return new;
end;
$$;
create trigger report_review_guard before update on public.reports for each row execute function private.guard_report_review();
create function private.log_review() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.is_moderator() then raise exception 'review_forbidden'; end if;
  insert into public.moderation_actions(moderator_id, report_id, decision) values(auth.uid(), new.id, new.status);
  return new;
end;
$$;
create trigger report_review_log after update on public.reports for each row execute function private.log_review();

create function private.check_recipe_complete() returns trigger language plpgsql security definer set search_path = '' as $$
declare target uuid; targets uuid[];
begin
  if TG_TABLE_NAME = 'recipes' then targets := array[coalesce(new.id, old.id)];
  elsif TG_OP = 'UPDATE' then targets := array[old.recipe_id, new.recipe_id];
  else targets := array[old.recipe_id]; end if;
  foreach target in array targets loop
  if exists(select 1 from public.recipes where id = target and status = 'published') and (
    not exists(select 1 from public.recipe_ingredients where recipe_id = target)
    or not exists(select 1 from public.recipe_steps where recipe_id = target)
  ) then raise exception 'published_recipe_needs_ingredients_and_steps' using errcode = '23514'; end if;
  end loop;
  return null;
end;
$$;
create constraint trigger recipe_complete after insert or update on public.recipes deferrable initially deferred for each row execute function private.check_recipe_complete();
create constraint trigger ingredients_complete after delete or update on public.recipe_ingredients deferrable initially deferred for each row execute function private.check_recipe_complete();
create constraint trigger steps_complete after delete or update on public.recipe_steps deferrable initially deferred for each row execute function private.check_recipe_complete();

-- RLS is enforced even when a user bypasses the web app and calls the Data API.
alter table public.profiles enable row level security;
alter table public.beverage_categories enable row level security;
alter table public.user_roles enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_steps enable row level security;
alter table public.recipe_images enable row level security;
alter table public.bookmarks enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;

create policy profiles_read on public.profiles for select to anon, authenticated using (true);
create policy profiles_edit on public.profiles for update to authenticated using (id = (select auth.uid()) and (select private.is_member())) with check (id = (select auth.uid()));
create policy categories_read on public.beverage_categories for select to anon, authenticated using (true);
create policy own_role_read on public.user_roles for select to authenticated using (user_id = (select auth.uid()));
create policy recipes_read on public.recipes for select to anon, authenticated using (
  (status = 'published' and hidden_at is null) or owner_id = (select auth.uid())
  or ((select private.is_moderator()) and private.can_read_recipe(id))
);
create policy recipes_create on public.recipes for insert to authenticated with check (owner_id = (select auth.uid()) and (select private.is_member()));
create policy recipes_edit on public.recipes for update to authenticated using ((owner_id = (select auth.uid()) and hidden_at is null) or (select private.is_moderator())) with check (owner_id = (select auth.uid()) or (select private.is_moderator()));
create policy recipes_delete on public.recipes for delete to authenticated using (owner_id = (select auth.uid()) and (select private.is_member()));

create policy ingredients_read on public.recipe_ingredients for select to anon, authenticated using (private.can_read_recipe(recipe_id));
create policy ingredients_create on public.recipe_ingredients for insert to authenticated with check (private.owns_recipe(recipe_id));
create policy ingredients_edit on public.recipe_ingredients for update to authenticated using (private.owns_recipe(recipe_id)) with check (private.owns_recipe(recipe_id));
create policy ingredients_delete on public.recipe_ingredients for delete to authenticated using (private.owns_recipe(recipe_id));
create policy steps_read on public.recipe_steps for select to anon, authenticated using (private.can_read_recipe(recipe_id));
create policy steps_create on public.recipe_steps for insert to authenticated with check (private.owns_recipe(recipe_id));
create policy steps_edit on public.recipe_steps for update to authenticated using (private.owns_recipe(recipe_id)) with check (private.owns_recipe(recipe_id));
create policy steps_delete on public.recipe_steps for delete to authenticated using (private.owns_recipe(recipe_id));
create policy images_read on public.recipe_images for select to anon, authenticated using (private.can_read_recipe(recipe_id));
create policy images_create on public.recipe_images for insert to authenticated with check (private.owns_recipe(recipe_id) and split_part(object_path,'/',1) = (select auth.uid())::text and split_part(object_path,'/',2) = recipe_id::text);
create policy images_edit on public.recipe_images for update to authenticated using (private.owns_recipe(recipe_id)) with check (private.owns_recipe(recipe_id) and split_part(object_path,'/',1) = (select auth.uid())::text and split_part(object_path,'/',2) = recipe_id::text);
create policy images_delete on public.recipe_images for delete to authenticated using (private.owns_recipe(recipe_id));

create policy bookmarks_read on public.bookmarks for select to authenticated using (user_id = (select auth.uid()));
create policy bookmarks_create on public.bookmarks for insert to authenticated with check (user_id = (select auth.uid()) and private.is_public_recipe(recipe_id) and (select private.is_member()));
create policy bookmarks_delete on public.bookmarks for delete to authenticated using (user_id = (select auth.uid()));
create policy comments_read on public.comments for select to anon, authenticated using (private.can_read_recipe(recipe_id) and (hidden_at is null or author_id = (select auth.uid()) or (select private.is_moderator())));
create policy comments_create on public.comments for insert to authenticated with check (author_id = (select auth.uid()) and private.is_public_recipe(recipe_id) and (select private.is_member()));
create policy comments_edit on public.comments for update to authenticated using ((author_id = (select auth.uid()) and hidden_at is null and private.is_public_recipe(recipe_id)) or (select private.is_moderator())) with check (author_id = (select auth.uid()) or (select private.is_moderator()));
create policy comments_delete on public.comments for delete to authenticated using (author_id = (select auth.uid()));
create policy reports_read on public.reports for select to authenticated using (reporter_id = (select auth.uid()) or (select private.is_moderator()));
create policy reports_create on public.reports for insert to authenticated with check (
  reporter_id = (select auth.uid()) and (select private.is_member()) and (
    (recipe_id is not null and private.is_public_recipe(recipe_id)) or
    (comment_id is not null and exists (select 1 from public.comments c where c.id = comment_id and c.hidden_at is null and private.is_public_recipe(c.recipe_id)))
  )
);
create policy reports_review on public.reports for update to authenticated using ((select private.is_moderator())) with check ((select private.is_moderator()));
create policy moderation_read on public.moderation_actions for select to authenticated using ((select private.is_moderator()));

-- Explicit grants: no role writes, no user-chosen email in public profile, no service key.
revoke all on public.profiles, public.beverage_categories, public.user_roles, public.recipes,
  public.recipe_ingredients, public.recipe_steps, public.recipe_images, public.bookmarks,
  public.comments, public.reports, public.moderation_actions from anon, authenticated;
grant select on public.profiles, public.beverage_categories, public.recipes, public.recipe_ingredients, public.recipe_steps, public.recipe_images, public.comments to anon, authenticated;
grant select on public.user_roles, public.bookmarks, public.reports, public.moderation_actions to authenticated;
grant update(username,display_name,bio,city,workplace,country_code,avatar_path) on public.profiles to authenticated;
grant insert, update, delete on public.recipes, public.recipe_ingredients, public.recipe_steps, public.recipe_images, public.comments to authenticated;
grant insert, delete on public.bookmarks to authenticated;
grant insert(reporter_id,recipe_id,comment_id,reason), update(status,reviewed_by,reviewed_at) on public.reports to authenticated;

-- Atomic save: children and recipe commit together; version prevents lost updates.
create function public.save_recipe(payload jsonb) returns uuid language plpgsql security invoker set search_path = '' as $$
declare target uuid; doc public.recipes; item jsonb; idx integer;
begin
  if not private.is_member() then raise exception 'verified_account_required' using errcode = '42501'; end if;
  if jsonb_typeof(payload->'ingredients') is distinct from 'array' or jsonb_typeof(payload->'steps') is distinct from 'array'
    or jsonb_array_length(payload->'ingredients') > 30 or jsonb_array_length(payload->'steps') > 30 then raise exception 'invalid_recipe' using errcode = '22023'; end if;
  doc := jsonb_populate_record(null::public.recipes, payload);
  if doc.id is null then
    insert into public.recipes(owner_id,title,description,category_id,method,beans,roaster,tasting_notes,dose_g,water_g,yield_g,temperature_c,time_seconds,grind,status)
    values(auth.uid(),doc.title,coalesce(doc.description,''),doc.category_id,coalesce(doc.method,''),coalesce(doc.beans,''),coalesce(doc.roaster,''),coalesce(doc.tasting_notes,''),doc.dose_g,doc.water_g,doc.yield_g,doc.temperature_c,doc.time_seconds,coalesce(doc.grind,''),coalesce(doc.status,'draft')) returning id into target;
  else
    update public.recipes set title=doc.title,description=coalesce(doc.description,''),category_id=doc.category_id,method=coalesce(doc.method,''),beans=coalesce(doc.beans,''),roaster=coalesce(doc.roaster,''),tasting_notes=coalesce(doc.tasting_notes,''),dose_g=doc.dose_g,water_g=doc.water_g,yield_g=doc.yield_g,temperature_c=doc.temperature_c,time_seconds=doc.time_seconds,grind=coalesce(doc.grind,''),status=doc.status
    where id=doc.id and owner_id=auth.uid() and version=doc.version and hidden_at is null returning id into target;
    if target is null then raise exception 'recipe_conflict_or_forbidden' using errcode = '40001'; end if;
    delete from public.recipe_ingredients where recipe_id = target;
    delete from public.recipe_steps where recipe_id = target;
  end if;
  idx := 0;
  for item in select * from jsonb_array_elements(payload->'ingredients') loop
    idx := idx + 1;
    insert into public.recipe_ingredients(recipe_id,position,name,quantity,unit) values(target,idx,item->>'name',(item->>'quantity')::numeric,coalesce(item->>'unit',''));
  end loop;
  idx := 0;
  for item in select * from jsonb_array_elements(payload->'steps') loop
    idx := idx + 1;
    insert into public.recipe_steps(recipe_id,position,instruction) values(target,idx,item->>'instruction');
  end loop;
  return target;
end;
$$;
create function public.review_report(target uuid, decision text) returns void language plpgsql security invoker set search_path = '' as $$
declare item public.reports;
begin
  if not private.is_moderator() or decision not in ('dismissed','actioned') then raise exception 'review_forbidden' using errcode = '42501'; end if;
  select * into item from public.reports where id=target and status='pending' for update;
  if not found then raise exception 'report_not_pending'; end if;
  if decision='actioned' then
    if item.recipe_id is not null then update public.recipes set hidden_at=now() where id=item.recipe_id;
    else update public.comments set hidden_at=now() where id=item.comment_id; end if;
  end if;
  update public.reports set status=decision where id=target;
end;
$$;

-- Private media only. No public URLs or signed URLs that survive a visibility change.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
  ('recipe-images','recipe-images',false,5242880,array['image/jpeg','image/png','image/webp']),
  ('avatars','avatars',false,2097152,array['image/jpeg','image/png','image/webp']);
create function private.allow_media_insert(bucket text, object_name text) returns boolean language plpgsql security definer set search_path = '' as $$
declare object_count integer;
begin
  if not private.is_member() or split_part(object_name,'/',1) <> auth.uid()::text then return false; end if;
  if bucket='recipe-images' then
    if not exists(select 1 from public.recipes where id::text=split_part(object_name,'/',2) and owner_id=auth.uid() and hidden_at is null) then return false; end if;
  elsif bucket <> 'avatars' then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text || bucket,0));
  select count(*) into object_count from storage.objects where bucket_id=bucket and split_part(name,'/',1)=auth.uid()::text
    and (bucket='avatars' or split_part(name,'/',2)=split_part(object_name,'/',2));
  if object_count >= 3 then return false; end if;
  perform private.consume_limit('media_upload',50,86400);
  return true;
end;
$$;
create policy media_read on storage.objects for select to anon, authenticated using (
  (bucket_id in ('recipe-images','avatars') and split_part(name,'/',1)=(select auth.uid())::text)
  or (bucket_id='recipe-images' and exists(select 1 from public.recipe_images i where i.object_path=name and private.can_read_recipe(i.recipe_id)))
  or (bucket_id='avatars' and exists(select 1 from public.profiles p where p.avatar_path=name))
);
create policy media_create on storage.objects for insert to authenticated with check (private.allow_media_insert(bucket_id,name));
create policy media_delete on storage.objects for delete to authenticated using (bucket_id in ('recipe-images','avatars') and split_part(name,'/',1)=(select auth.uid())::text);

revoke all on all functions in schema private from public;
grant execute on function private.is_member(),private.is_moderator(),private.can_read_recipe(uuid),private.owns_recipe(uuid),private.is_public_recipe(uuid) to anon, authenticated;
grant execute on function private.consume_limit(text,integer,integer),private.allow_media_insert(text,text) to authenticated;
revoke all on function public.save_recipe(jsonb),public.review_report(uuid,text) from public, anon;
grant execute on function public.save_recipe(jsonb),public.review_report(uuid,text) to authenticated;
