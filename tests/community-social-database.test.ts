import {afterAll,beforeAll,describe,expect,it} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';

const db=new PGlite();
const alice='11111111-1111-4111-8111-111111111111',bob='22222222-2222-4222-8222-222222222222',carol='33333333-3333-4333-8333-333333333333',unverified='44444444-4444-4444-8444-444444444444',capped='55555555-5555-4555-8555-555555555555',limited='66666666-6666-4666-8666-666666666666';
async function as<T=Record<string,unknown>>(user:string|null,sql:string,params:unknown[]=[]){return db.transaction(async tx=>{await tx.exec(`set local role ${user?'authenticated':'anon'}`);await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user||'']);return tx.query<T>(sql,params);});}
const insert='insert into public.member_follows(follower_id,followed_id) values($1,$2) on conflict(follower_id,followed_id) do nothing';
beforeAll(async()=>{
  await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create schema storage;
    create table auth.users(id uuid primary key,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth,storage,public to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner_id text,unique(bucket_id,name));
    alter table storage.objects enable row level security;grant select on storage.objects to anon,authenticated;grant insert,delete on storage.objects to authenticated;`);
  await db.exec(readFileSync('supabase/schema.sql','utf8'));
  await db.exec(readFileSync('supabase/community-social.sql','utf8'));
  for(const id of [alice,bob,carol,capped,limited])await db.query('insert into auth.users(id,email_confirmed_at) values($1,now())',[id]);
  await db.query('insert into auth.users(id) values($1)',[unverified]);
  await db.query("insert into public.user_roles(user_id,role) values($1,'moderator')",[carol]);
},180000);
afterAll(async()=>db.close());

describe('private persistent member following',()=>{
  it('matches the CLI-created migration and enables RLS',async()=>{
    expect(readFileSync('supabase/migrations/20261121004429_community_member_follows.sql','utf8')).toBe(readFileSync('supabase/community-social.sql','utf8'));
    expect((await db.query<{relrowsecurity:boolean}>("select relrowsecurity from pg_class where oid='public.member_follows'::regclass")).rows[0].relrowsecurity).toBe(true);
  });
  it('persists per-account follows across requests and duplicate inserts are idempotent',async()=>{
    await as(alice,insert,[alice,bob]);await as(alice,insert,[alice,bob]);
    expect((await as(alice,'select followed_id from public.member_follows')).rows).toEqual([{followed_id:bob}]);
    expect((await db.query<{attempts:number}>("select attempts from private.rate_limits where user_id=$1 and action='follow_create'",[alice])).rows[0].attempts).toBe(1);
  });
  it('keeps the graph private from anonymous visitors, followed members, and other members',async()=>{
    expect((await as(null,'select * from public.member_follows')).rows).toEqual([]);
    expect((await as(bob,'select * from public.member_follows')).rows).toEqual([]);
    expect((await as(carol,'select * from public.member_follows where follower_id=$1',[alice])).rows).toEqual([]);
  });
  it('rejects forged owner inserts, self-follow, unverified writes, and anonymous writes',async()=>{
    await expect(as(carol,insert,[alice,carol])).rejects.toThrow();
    await expect(as(alice,insert,[alice,alice])).rejects.toThrow(/member_follows_no_self/);
    await expect(as(unverified,insert,[unverified,bob])).rejects.toThrow(/verified_account_required/);
    await expect(as(null,insert,[alice,bob])).rejects.toThrow();
    await expect(as(null,'delete from public.member_follows')).rejects.toThrow();
  });
  it('does not grant updates or allow caller-selected timestamps',async()=>{
    await expect(as(alice,'update public.member_follows set followed_id=$1',[carol])).rejects.toThrow();
    await expect(as(alice,'insert into public.member_follows(follower_id,followed_id,created_at) values($1,$2,now())',[alice,carol])).rejects.toThrow();
  });
  it('lets only the owner unfollow, with repeated deletes remaining safe',async()=>{
    expect((await as(carol,'delete from public.member_follows where follower_id=$1 returning followed_id',[alice])).rows).toEqual([]);
    await as(alice,'delete from public.member_follows where followed_id=$1',[bob]);await as(alice,'delete from public.member_follows where followed_id=$1',[bob]);
    expect((await as(alice,'select * from public.member_follows')).rows).toEqual([]);
    await as(alice,insert,[alice,bob]);
  });
  it('follows never grant access to a creator’s drafts or hidden recipes',async()=>{
    const recipe=(title:string,status:string)=>JSON.stringify({title,category_id:'coffee',status,method:'V60',ingredients:[{name:'قهوة',quantity:18,unit:'g'}],steps:[{instruction:'حضّر القهوة'}]});
    const published=(await as<{id:string}>(bob,'select public.save_recipe($1::jsonb) as id',[recipe('منشورة','published')])).rows[0].id;
    await as(bob,'select public.save_recipe($1::jsonb)',[recipe('خاصة','draft')]);
    const hidden=(await as<{id:string}>(bob,'select public.save_recipe($1::jsonb) as id',[recipe('مخفية','published')])).rows[0].id;
    const report=(await as<{id:string}>(alice,'insert into public.reports(recipe_id,reason) values($1,$2) returning id',[hidden,'محتوى يحتاج إلى المراجعة'])).rows[0].id;
    await as(carol,"select public.review_report($1,'actioned')",[report]);
    const feed=await as(alice,"select id from public.recipes where owner_id in(select followed_id from public.member_follows) and status='published' and hidden_at is null order by created_at desc,id");
    expect(feed.rows).toEqual([{id:published}]);
  });
  it('enforces the 200-account cap atomically, while duplicates still succeed at the cap',async()=>{
    const targets=(await db.query<{id:string}>("insert into auth.users(id,email_confirmed_at) select gen_random_uuid(),now() from generate_series(1,201) returning id")).rows.map(row=>row.id);
    await as(capped,'insert into public.member_follows(follower_id,followed_id) select $1,value::uuid from jsonb_array_elements_text($2::jsonb)',[capped,JSON.stringify(targets.slice(0,200))]);
    await as(capped,insert,[capped,targets[0]]);
    await expect(as(capped,insert,[capped,targets[200]])).rejects.toThrow(/follow_limit_reached/);
    expect((await as<{count:number}>(capped,'select count(*)::integer as count from public.member_follows')).rows[0].count).toBe(200);
    await as(capped,'delete from public.member_follows where followed_id=$1',[targets[0]]);
    await as(capped,insert,[capped,targets[200]]);
    expect((await as<{count:number}>(capped,'select count(*)::integer as count from public.member_follows')).rows[0].count).toBe(200);
  });
  it('rate-limits repeated real follow inserts rather than duplicate requests',async()=>{
    await as(limited,`do $$ begin for attempt in 1..240 loop
      insert into public.member_follows(follower_id,followed_id) values(auth.uid(),'${bob}'::uuid);
      delete from public.member_follows where follower_id=auth.uid() and followed_id='${bob}'::uuid;
    end loop; end $$;`);
    await expect(as(limited,insert,[limited,bob])).rejects.toThrow(/rate_limit/);
  });
  it('removes relations when either account is deleted',async()=>{
    const target=(await db.query<{id:string}>('insert into auth.users(id,email_confirmed_at) values(gen_random_uuid(),now()) returning id')).rows[0].id;
    await as(carol,insert,[carol,target]);await db.query('delete from auth.users where id=$1',[target]);
    expect((await as(carol,'select * from public.member_follows')).rows).toEqual([]);
    const follower=(await db.query<{id:string}>('insert into auth.users(id,email_confirmed_at) values(gen_random_uuid(),now()) returning id')).rows[0].id;
    await as(follower,insert,[follower,bob]);await db.query('delete from auth.users where id=$1',[follower]);
    expect((await db.query('select * from public.member_follows where follower_id=$1',[follower])).rows).toEqual([]);
  });
});
