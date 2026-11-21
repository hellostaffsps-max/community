import {describe,expect,it,vi} from 'vitest';
import {createClient} from '@supabase/supabase-js';
vi.mock('server-only',()=>({}));
import {getCommunitySocial,setCommunityFollow} from '../src/lib/community-social';

const alice='11111111-1111-4111-8111-111111111111',bob='22222222-2222-4222-8222-222222222222';
type Captured={url:URL;method:string;headers:Headers;body:string};
function setup(respond:(request:Captured)=>Response){
  const requests:Captured[]=[];
  const client=createClient('https://community-test.invalid','test-key',{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false},global:{fetch:async(input,init)=>{
    const req={url:new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url),method:init?.method||'GET',headers:new Headers(init?.headers),body:String(init?.body||'')};requests.push(req);return respond(req);
  }}});return {client,requests};
}
function json(body:unknown,status=200,headers:Record<string,string>={}){return new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json',...headers}});}

describe('Supabase following API integration',()=>{
  it('probes anonymous capability without retrieving graph rows and disables controls when the table is missing',async()=>{
    const missing=setup(()=>json({code:'PGRST205',message:'table not in schema cache'},404));
    expect(await getCommunitySocial(missing.client)).toEqual({available:false,followedIds:[],followingCount:0});
    expect(missing.requests[0].method).toBe('GET');expect(missing.requests[0].url.searchParams.get('limit')).toBe('0');
    const ready=setup(()=>json([]));expect(await getCommunitySocial(ready.client)).toEqual({available:true,followedIds:[],followingCount:0});
  });
  it('returns only current-account following IDs and a verified complete count',async()=>{
    const {client,requests}=setup(()=>json([{followed_id:bob}],200,{'Content-Range':'0-0/1'}));
    expect(await getCommunitySocial(client,alice)).toEqual({available:true,followedIds:[bob],followingCount:1});
    expect(requests[0].url.searchParams.get('follower_id')).toBe(`eq.${alice}`);
    expect(requests[0].url.searchParams.get('limit')).toBe('200');expect(requests[0].headers.get('prefer')).toContain('count=exact');
  });
  it('does not silently truncate counts or mask unexpected service failures',async()=>{
    const truncated=setup(()=>json([{followed_id:bob}],200,{'Content-Range':'0-0/201'}));await expect(getCommunitySocial(truncated.client,alice)).rejects.toThrow('كاملة');
    const failure=setup(()=>json({code:'XX000',message:'database unavailable'},500));await expect(getCommunitySocial(failure.client,alice)).rejects.toMatchObject({code:'XX000'});
  });
  it('uses true ignore-duplicate upsert semantics without allowing arbitrary owners',async()=>{
    const {client,requests}=setup(req=>req.url.pathname.endsWith('/profiles')?json({id:bob}):new Response(null,{status:201}));
    expect(await setCommunityFollow(client,alice,bob,true)).toEqual({following:true});
    const write=requests.find(req=>req.method==='POST')!;
    expect(write.url.searchParams.get('on_conflict')).toBe('follower_id,followed_id');expect(write.headers.get('prefer')).toContain('resolution=ignore-duplicates');
    expect(JSON.parse(write.body)).toEqual({follower_id:alice,followed_id:bob});
  });
  it('rejects self-follow before a database request, and scopes unfollow to both IDs',async()=>{
    const {client,requests}=setup(()=>new Response(null,{status:204}));
    await expect(setCommunityFollow(client,alice,alice,true)).rejects.toMatchObject({status:400});expect(requests).toHaveLength(0);
    expect(await setCommunityFollow(client,alice,bob,false)).toEqual({following:false});
    expect(requests[0].method).toBe('DELETE');expect(requests[0].url.searchParams.get('follower_id')).toBe(`eq.${alice}`);expect(requests[0].url.searchParams.get('followed_id')).toBe(`eq.${bob}`);
  });
  it('reports missing capability, absent targets, and account cap failures without returning false success',async()=>{
    const missing=setup(req=>req.url.pathname.endsWith('/profiles')?json({id:bob}):json({code:'42P01',message:'not installed'},404));
    await expect(setCommunityFollow(missing.client,alice,bob,true)).rejects.toMatchObject({status:503});
    const absent=setup(()=>json([]));await expect(setCommunityFollow(absent.client,alice,bob,true)).rejects.toMatchObject({status:404});
    const capped=setup(req=>req.url.pathname.endsWith('/profiles')?json({id:bob}):json({code:'P0001',message:'follow_limit_reached'},400));
    await expect(setCommunityFollow(capped.client,alice,bob,true)).rejects.toMatchObject({status:409});
  });
});
