import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {HttpError} from '../src/lib/http';

const {client,getClient,requireUser,setFollow}=vi.hoisted(()=>({client:{testClient:true},getClient:vi.fn(),requireUser:vi.fn(),setFollow:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({supabase:getClient}));
vi.mock('@/lib/data',()=>({requireUser}));
vi.mock('@/lib/community-social',()=>({setCommunityFollow:setFollow}));
import {POST,DELETE} from '../src/app/api/community/[...path]/route';

const viewerId='11111111-1111-4111-8111-111111111111';
const targetId='22222222-2222-4222-8222-222222222222';
const attackerId='33333333-3333-4333-8333-333333333333';

function request(method:'POST'|'DELETE',options:{body?:unknown;origin?:string;target?:string;path?:string[]}={}){
  const path=options.path||['follows',options.target||targetId];
  const body=options.body===undefined?(method==='POST'?{}:undefined):options.body;
  const req=new Request(`https://goatlab.my/api/community/${path.join('/')}?follower_id=${attackerId}`,{
    method,headers:{origin:options.origin||'https://goatlab.my',...(body===undefined?{}:{'content-type':'application/json'})},
    ...(body===undefined?{}:{body:JSON.stringify(body)})
  });
  return (method==='POST'?POST:DELETE)(req,{params:Promise.resolve({path})});
}

beforeEach(()=>{
  vi.resetAllMocks();vi.stubEnv('APP_ORIGIN','https://goatlab.my');
  getClient.mockResolvedValue(client);
  requireUser.mockResolvedValue({id:viewerId,email_confirmed_at:'2026-11-21'});
  setFollow.mockImplementation(async(_client,_viewer,_target,following:boolean)=>({following}));
});
afterEach(()=>vi.unstubAllEnvs());

describe('follow HTTP trust boundary',()=>{
  it.each(['POST','DELETE'] as const)('%s delegates only the verified session owner and validated target',async method=>{
    const response=await request(method);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({following:method==='POST'});
    expect(requireUser).toHaveBeenCalledWith(client);
    expect(setFollow).toHaveBeenCalledExactlyOnceWith(client,viewerId,targetId,method==='POST');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('rejects injected owner or target fields in the POST body before any follow mutation',async()=>{
    for(const body of [{follower_id:attackerId},{user_id:attackerId},{followed_id:attackerId},{following:false}]){
      expect((await request('POST',{body})).status).toBe(400);
    }
    expect(setFollow).not.toHaveBeenCalled();
  });

  it('cannot use a DELETE body to unfollow on behalf of another account',async()=>{
    const response=await request('DELETE',{body:{follower_id:attackerId,followed_id:attackerId}});
    expect(response.status).toBe(200);
    expect(setFollow).toHaveBeenCalledExactlyOnceWith(client,viewerId,targetId,false);
  });

  it.each(['POST','DELETE'] as const)('%s rejects a non-UUID target without delegating',async method=>{
    expect((await request(method,{target:'not-a-user-id'})).status).toBe(400);
    expect(setFollow).not.toHaveBeenCalled();
  });

  it('rejects anonymous or unconfirmed callers before reading any mutation payload',async()=>{
    requireUser.mockRejectedValueOnce(new HttpError(401,'سجّل دخولك.')).mockRejectedValueOnce(new HttpError(403,'أكّد بريدك.'));
    expect((await request('POST')).status).toBe(401);
    expect((await request('DELETE')).status).toBe(403);
    expect(setFollow).not.toHaveBeenCalled();
  });

  it('rejects a foreign origin before creating a client or checking the session',async()=>{
    expect((await request('POST',{origin:'https://foreign.invalid'})).status).toBe(403);
    expect(getClient).not.toHaveBeenCalled();
    expect(requireUser).not.toHaveBeenCalled();
    expect(setFollow).not.toHaveBeenCalled();
  });

  it('rejects path segments beyond the selected follow target',async()=>{
    expect((await request('POST',{path:['follows',targetId,attackerId]})).status).toBe(404);
    expect(setFollow).not.toHaveBeenCalled();
  });
});
