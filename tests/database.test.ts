import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';

// Real PostgreSQL engine and RLS. The Auth and Storage service tables are stubs;
// this does not claim to test GoTrue, PostgREST, SMTP or the Storage HTTP service.
const db = new PGlite();
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
const moderator = '33333333-3333-4333-8333-333333333333';
const unverified = '44444444-4444-4444-8444-444444444444';
let published: string, draft: string, other: string, report: string;
async function as<T = Record<string, unknown>>(user: string | null, sql: string, params: unknown[] = []) {
  return db.transaction(async tx => {
    await tx.exec(`set local role ${user ? 'authenticated' : 'anon'}`);
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user || '']);
    return tx.query<T>(sql, params);
  });
}
const recipe = (status = 'published') => ({ title: 'قهوة الترشيح', description: 'وصفة حقيقية للاختبار', category_id: 'coffee', method: 'V60', status,
  ingredients: [{name:'قهوة',quantity:18,unit:'g'}, {name:'ماء',quantity:300,unit:'g'}], steps:[{instruction:'اطحن البن وأضف الماء بالتدريج.'}] });
async function save(user: string, payload: object) {
  return (await as<{id:string}>(user, 'select public.save_recipe($1::jsonb) as id', [JSON.stringify(payload)])).rows[0].id;
}

beforeAll(async () => {
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth, storage, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner_id text, unique(bucket_id,name));
    alter table storage.objects enable row level security;
    grant select on storage.objects to anon, authenticated;
    grant insert,delete on storage.objects to authenticated;
  `);
  await db.exec(readFileSync('supabase/schema.sql','utf8'));
  await db.query("insert into auth.users(id,email_confirmed_at,raw_user_meta_data) values ($1,now(),'{\"role\":\"admin\"}'),($2,now(),'{}'),($3,now(),'{}'),($4,null,'{}')", [alice,bob,moderator,unverified]);
  await db.query("insert into public.user_roles(user_id,role) values ($1,'moderator')", [moderator]);
  published = await save(alice, recipe());
  draft = await save(alice, recipe('draft'));
  other = await save(bob, recipe());
});
afterAll(async () => { await db.close(); });

describe('database access boundary', () => {
  it('enables RLS on every public table', async () => {
    const result = await db.query<{relname:string}>('select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname=\'public\' and c.relkind=\'r\' and not c.relrowsecurity');
    expect(result.rows).toEqual([]);
  });
  it('creates a profile without email or trusting role metadata', async () => {
    const result = await as(alice,'select * from public.profiles where id=$1',[alice]);
    expect(result.rows[0]).not.toHaveProperty('email');
    expect((await as(alice,'select * from public.user_roles')).rows).toHaveLength(0);
  });
  it('allows public discovery but keeps drafts and children private', async () => {
    expect((await as(null,'select id from public.recipes')).rows).toHaveLength(2);
    expect((await as(bob,'select id from public.recipes where id=$1',[draft])).rows).toHaveLength(0);
    expect((await as(bob,'select * from public.recipe_steps where recipe_id=$1',[draft])).rows).toHaveLength(0);
    expect((await as(alice,'select id from public.recipes where id=$1',[draft])).rows).toHaveLength(1);
    expect((await as(moderator,'select id from public.recipes where id=$1',[draft])).rows).toHaveLength(0);
  });
  it('rejects changing another member’s recipe, children or owner', async () => {
    expect((await as(bob,"update public.recipes set title='سرقة' where id=$1 returning id",[published])).rows).toHaveLength(0);
    await expect(as(alice,'update public.recipes set owner_id=$1 where id=$2',[bob,published])).rejects.toThrow();
    await expect(as(bob,"insert into public.recipe_steps(recipe_id,position,instruction) values($1,2,'سرقة')",[published])).rejects.toThrow();
    await expect(save(bob,{...recipe(),id:published,version:1})).rejects.toThrow();
  });
  it('blocks self-promotion and role tampering', async () => {
    await expect(as(alice,"insert into public.user_roles(user_id,role) values($1,'admin')",[alice])).rejects.toThrow();
    await expect(as(alice,"update public.user_roles set role='admin' where user_id=$1",[alice])).rejects.toThrow();
    await expect(as(alice,'select public.review_report(gen_random_uuid(),\'actioned\')')).rejects.toThrow();
  });
  it('requires verified membership for writing', async () => {
    await expect(save(unverified,recipe())).rejects.toThrow();
    await expect(as(null,"insert into public.comments(recipe_id,author_id,body) values($1,$2,'test')",[published,alice])).rejects.toThrow();
  });
  it('saves atomically, rolls back invalid children and prevents stale overwrite', async () => {
    const before = (await as(alice,'select version,title from public.recipes where id=$1',[draft])).rows[0];
    await expect(save(alice,{...recipe(),id:draft,version:1,steps:[{instruction:''}]})).rejects.toThrow();
    expect((await as(alice,'select version,title from public.recipes where id=$1',[draft])).rows[0]).toEqual(before);
    await save(alice,{...recipe('draft'),id:draft,version:1,title:'وصفة معدّلة'});
    await expect(save(alice,{...recipe('draft'),id:draft,version:1})).rejects.toThrow();
  });
  it('requires ingredients and steps when publishing, including direct writes', async () => {
    await expect(save(alice,{...recipe(),ingredients:[]})).rejects.toThrow();
    await expect(as(alice,'delete from public.recipe_steps where recipe_id=$1',[published])).rejects.toThrow();
    await expect(as(alice,'update public.recipe_steps set recipe_id=$1, position=2 where recipe_id=$2',[draft,published])).rejects.toThrow(/published_recipe_needs/);
  });
  it('keeps the executable migration identical to the tested schema', () => {
    expect(readFileSync('supabase/migrations/20261115000204_community_foundation.sql','utf8')).toBe(readFileSync('supabase/schema.sql','utf8'));
  });
  it('permits optional coffee metrics and rejects invalid values', async () => {
    await expect(save(alice,{...recipe('draft'),temperature_c:101})).rejects.toThrow();
    await expect(save(alice,{...recipe('draft'),dose_g:null,water_g:null})).resolves.toBeTypeOf('string');
  });
  it('keeps saves private and supports unsaving', async () => {
    await as(alice,'insert into public.bookmarks(recipe_id) values($1)',[other]);
    expect((await as(bob,'select * from public.bookmarks')).rows).toHaveLength(0);
    expect((await as(moderator,'select * from public.bookmarks')).rows).toHaveLength(0);
    expect((await as(alice,'select * from public.bookmarks')).rows).toHaveLength(1);
    await as(alice,'delete from public.bookmarks where recipe_id=$1',[other]);
    expect((await as(alice,'select * from public.bookmarks')).rows).toHaveLength(0);
  });
  it('allows comment ownership and rejects spoofing or moving comments', async () => {
    const comment = (await as<{id:string}>(bob,"insert into public.comments(recipe_id,body) values($1,'تجربة رائعة') returning id",[published])).rows[0].id;
    expect((await as(alice,"update public.comments set body='تغيير' where id=$1 returning id",[comment])).rows).toHaveLength(0);
    await expect(as(bob,'update public.comments set recipe_id=$1 where id=$2',[other,comment])).rejects.toThrow();
    await as(bob,"update public.comments set body='تجربة محدّثة' where id=$1",[comment]);
    await as(bob,'delete from public.comments where id=$1',[comment]);
  });
  it('protects draft image paths, bytes access and ownership', async () => {
    const path = `${alice}/${draft}/test.png`;
    await as(alice,"insert into storage.objects(bucket_id,name) values('recipe-images',$1)",[path]);
    await as(alice,'insert into public.recipe_images(recipe_id,object_path) values($1,$2)',[draft,path]);
    expect((await as(bob,'select * from storage.objects where name=$1',[path])).rows).toHaveLength(0);
    expect((await as(null,'select * from storage.objects where name=$1',[path])).rows).toHaveLength(0);
    expect((await as(alice,'select * from storage.objects where name=$1',[path])).rows).toHaveLength(1);
    await expect(as(bob,"insert into storage.objects(bucket_id,name) values('recipe-images',$1)",[`${alice}/${draft}/stolen.png`])).rejects.toThrow();
    await expect(as(bob,'insert into public.recipe_images(recipe_id,object_path) values($1,$2)',[other,path])).rejects.toThrow();
  });
  it('caps storage objects and keeps buckets private', async () => {
    await as(alice,"insert into storage.objects(bucket_id,name) values('recipe-images',$1)",[`${alice}/${draft}/two.png`]);
    await as(alice,"insert into storage.objects(bucket_id,name) values('recipe-images',$1)",[`${alice}/${draft}/three.png`]);
    await expect(as(alice,"insert into storage.objects(bucket_id,name) values('recipe-images',$1)",[`${alice}/${draft}/four.png`])).rejects.toThrow();
    expect((await db.query('select id from storage.buckets where public=true')).rows).toHaveLength(0);
  });
  it('keeps reports private and prevents forged reviews', async () => {
    report = (await as<{id:string}>(bob,'insert into public.reports(recipe_id,reason) values($1,$2) returning id',[published,'محتوى يحتاج المراجعة'])).rows[0].id;
    expect((await as(alice,'select * from public.reports')).rows).toHaveLength(0);
    expect((await as(bob,'select * from public.reports')).rows).toHaveLength(1);
    expect((await as(bob,"update public.reports set status='dismissed' where id=$1 returning id",[report])).rows).toHaveLength(0);
    await expect(as(bob,"insert into public.reports(recipe_id,reason,status) values($1,'بلاغ مزور','actioned')",[other])).rejects.toThrow();
  });
  it('hides reported content, logs review and prevents owner undo', async () => {
    await expect(as(moderator,"update public.recipes set title='تحرير المشرف' where id=$1",[published])).rejects.toThrow();
    await as(moderator,"select public.review_report($1,'actioned')",[report]);
    expect((await as(null,'select id from public.recipes where id=$1',[published])).rows).toHaveLength(0);
    expect((await as(bob,'select id from public.recipes where id=$1',[published])).rows).toHaveLength(0);
    expect((await as(alice,'select id from public.recipes where id=$1',[published])).rows).toHaveLength(1);
    expect((await as(alice,'update public.recipes set hidden_at=null where id=$1 returning id',[published])).rows).toHaveLength(0);
    await expect(save(alice,{...recipe(),id:published,version:2})).rejects.toThrow();
    expect((await as(moderator,'select * from public.moderation_actions')).rows).toHaveLength(1);
  });
  it('applies database comment limits even when bypassing the server', async () => {
    for(let i=0;i<29;i++) await as(bob,"insert into public.comments(recipe_id,body) values($1,'تجربة')",[other]);
    await expect(as(bob,"insert into public.comments(recipe_id,body) values($1,'تجربة أخرى')",[other])).rejects.toThrow(/rate_limit/);
  });
});
