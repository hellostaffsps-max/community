import {describe,expect,it,vi} from 'vitest';
import {createClient} from '@supabase/supabase-js';
import type {Recipe} from '../src/lib/types';
vi.mock('server-only',()=>({}));
import {explore,people,savedRecipeIds} from '../src/lib/data';

const viewerId='11111111-1111-4111-8111-111111111111';
const authorId='22222222-2222-4222-8222-222222222222';
const otherAuthorId='33333333-3333-4333-8333-333333333333';
const recipeId='44444444-4444-4444-8444-444444444444';
const secondRecipeId='55555555-5555-4555-8555-555555555555';
type Captured={url:URL;headers:Headers};
function setup(body:unknown=[],total=0){
  const requests:Captured[]=[];
  const client=createClient('https://community-test.invalid','test-key',{
    auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false},
    global:{fetch:async(input,init)=>{
      requests.push({url:new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url),headers:new Headers(init?.headers)});
      return new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json','Content-Range':`0-0/${total}`}});
    }}
  });
  return {client,requests};
}

describe('community discovery privacy and paging',()=>{
  it('keeps an empty following feed and directory empty without querying the global collection',async()=>{
    const {client,requests}=setup([{id:recipeId}],100);
    expect(await explore(client,'','',0,undefined,[])).toEqual({recipes:[],hasMore:false,total:0});
    expect(await people(client,'',0,[])).toEqual({members:[],hasMore:false,total:0});
    expect(requests).toHaveLength(0);
  });

  it.each([
    {scope:'all members',owner:undefined,following:undefined},
    {scope:'one author',owner:authorId,following:undefined},
    {scope:'followed authors',owner:undefined,following:[authorId,otherAuthorId]},
    {scope:'author within following',owner:authorId,following:[authorId,otherAuthorId]},
  ])('only requests public, unhidden recipes for $scope',async({owner,following})=>{
    const {client,requests}=setup([{id:recipeId}],37);
    const result=await explore(client,'','V60',2,owner,following);
    expect(result).toEqual({recipes:[{id:recipeId}],hasMore:true,total:37});
    expect(requests).toHaveLength(1);
    const {url,headers}=requests[0];
    expect(url.pathname).toBe('/rest/v1/recipes');
    expect(url.searchParams.get('status')).toBe('eq.published');
    expect(url.searchParams.get('hidden_at')).toBe('is.null');
    expect(url.searchParams.get('method')).toBe('eq.V60');
    expect(url.searchParams.get('offset')).toBe('24');
    expect(url.searchParams.get('limit')).toBe('12');
    expect(url.searchParams.get('order')).toBe('created_at.desc,id.asc');
    expect(headers.get('prefer')).toContain('count=exact');
    const owners=url.searchParams.getAll('owner_id');
    expect(owners).toEqual([...(owner?[`eq.${owner}`]:[]),...(following?[`in.(${following.join(',')})`]:[])]);
  });

  it('does not advertise another page after reaching the exact filtered count',async()=>{
    const {client,requests}=setup([{id:recipeId}],37);
    const result=await explore(client,'','',3,undefined,[authorId]);
    expect(result.hasMore).toBe(false);
    expect(result.total).toBe(37);
    expect(requests[0].url.searchParams.get('offset')).toBe('36');
  });

  it('reads bookmark state only for the authenticated viewer and recipes on this page',async()=>{
    const {client,requests}=setup([{recipe_id:secondRecipeId}],1);
    const recipes=[{id:recipeId},{id:secondRecipeId}] as Recipe[];
    expect(await savedRecipeIds(client,undefined,recipes)).toEqual([]);
    expect(await savedRecipeIds(client,viewerId,[])).toEqual([]);
    expect(requests).toHaveLength(0);
    expect(await savedRecipeIds(client,viewerId,recipes)).toEqual([secondRecipeId]);
    expect(requests).toHaveLength(1);
    const query=requests[0].url.searchParams;
    expect(requests[0].url.pathname).toBe('/rest/v1/bookmarks');
    expect(query.get('select')).toBe('recipe_id');
    expect(query.get('user_id')).toBe(`eq.${viewerId}`);
    expect(query.get('recipe_id')).toBe(`in.(${recipeId},${secondRecipeId})`);
  });

  it('keeps followed creators with unfinished names visible while hiding them from general discovery',async()=>{
    const profile={id:authorId,username:'u_new_creator',display_name:'عضو جديد'};
    const followed=setup([profile],1);
    expect(await people(followed.client,'',0,[authorId])).toEqual({members:[profile],hasMore:false,total:1});
    expect(followed.requests[0].url.searchParams.get('id')).toBe(`in.(${authorId})`);
    expect(followed.requests[0].url.searchParams.getAll('display_name')).not.toContain('neq.عضو جديد');
    const discovery=setup();await people(discovery.client,'',0);
    expect(discovery.requests[0].url.searchParams.getAll('display_name')).toContain('neq.عضو جديد');
  });

  it('keeps literal people-search filtering scoped to followed profiles',async()=>{
    const {client,requests}=setup([{id:authorId}],25);
    const result=await people(client,'  50%_\\coffee  ',1,[authorId]);
    expect(result).toEqual({members:[{id:authorId}],hasMore:false,total:25});
    const {url,headers}=requests[0];
    expect(url.pathname).toBe('/rest/v1/profiles');
    expect(url.searchParams.getAll('display_name')).toContain('ilike.%50\\%\\_\\\\coffee%');
    expect(url.searchParams.get('id')).toBe(`in.(${authorId})`);
    expect(url.searchParams.get('offset')).toBe('24');
    expect(url.searchParams.get('limit')).toBe('24');
    expect(headers.get('prefer')).toContain('count=exact');
    expect(url.searchParams.get('select')).not.toContain('email');
  });
});
