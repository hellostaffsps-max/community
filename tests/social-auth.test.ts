import {createHash} from 'node:crypto';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';

const cookieJar=vi.hoisted(()=>({
  values:new Map<string,string>(),
  set:vi.fn(),
  getAll:vi.fn(),
}));
vi.mock('server-only',()=>({}));
vi.mock('next/headers',()=>({cookies:async()=>({getAll:cookieJar.getAll,set:cookieJar.set})}));

import {availableSocialProviders,validatedSocialAuthorizeUrl} from '../src/lib/social-auth';
import {GET as providers} from '../src/app/api/auth/providers/route';
import {POST as oauth} from '../src/app/api/auth/oauth/route';
import {GET as callback} from '../src/app/auth/callback/route';

const project='https://feyugmltesjdwejbzgzs.supabase.co';
const publishable='sb_publishable_test-only';
const allowed={disable_signup:false,external:{google:true,apple:false,github:true}};
const fetchMock=vi.fn<typeof fetch>();
function start(body:unknown,origin:string|null='https://goatlab.my'){
  const headers:Record<string,string>={'content-type':'application/json','x-forwarded-host':'foreign.invalid'};
  if(origin)headers.origin=origin;
  return oauth(new Request('https://foreign.invalid/api/auth/oauth',{method:'POST',headers,body:JSON.stringify(body)}));
}
function settingsResponse(body:unknown=allowed){return Response.json(body);}
async function readAuthorizePayload(response:Response){
  const payload:unknown=await response.json();
  if(typeof payload!=='object'||payload===null||Array.isArray(payload)||!('url' in payload)||typeof payload.url!=='string')throw new Error('Expected an authorize URL response');
  return {...payload,url:payload.url};
}
function authorizeUrl(next='/account'){
  const redirect=new URL('/auth/callback','https://goatlab.my');redirect.searchParams.set('flow','oauth');
  if(next!=='/account')redirect.searchParams.set('next',next);
  const url=new URL('/auth/v1/authorize',project);
  url.search=new URLSearchParams({provider:'google',redirect_to:redirect.href,code_challenge:'a'.repeat(43),code_challenge_method:'s256'}).toString();
  return {url,redirect};
}
beforeEach(()=>{
  vi.clearAllMocks();
  vi.stubEnv('APP_ORIGIN','https://goatlab.my');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL',project);
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',publishable);
  vi.stubEnv('ALLOW_PUBLIC_SIGNUP','true');
  vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY','test-turnstile');
  cookieJar.values.clear();
  cookieJar.getAll.mockImplementation(()=>[...cookieJar.values].map(([name,value])=>({name,value})));
  cookieJar.set.mockImplementation((name:string,value:string)=>{if(value)cookieJar.values.set(name,value);else cookieJar.values.delete(name);});
  fetchMock.mockReset().mockImplementation(async()=>settingsResponse());
  vi.stubGlobal('fetch',fetchMock);
});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.restoreAllMocks();});

describe('configured social provider discovery',()=>{
  it('returns only explicitly enabled allowed providers without forwarding sessions or settings payloads',async()=>{
    fetchMock.mockResolvedValue(settingsResponse({...allowed,client_secret:'must-not-leave-server'}));
    const response=await providers();
    expect(await response.json()).toEqual({providers:['google']});
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url,options]=fetchMock.mock.calls[0];
    expect(url).toBe(project+'/auth/v1/settings');
    expect(options).toMatchObject({headers:{apikey:publishable},cache:'no-store',credentials:'omit',redirect:'error'});
    expect(new Headers(options?.headers).has('authorization')).toBe(false);
    expect(new Headers(options?.headers).has('cookie')).toBe(false);
    expect(options?.signal).toBeInstanceOf(AbortSignal);
  });
  it('does not expose Apple until its actual flag is enabled',async()=>{
    expect(await availableSocialProviders()).toEqual(['google']);
    fetchMock.mockResolvedValue(settingsResponse({disable_signup:false,external:{google:true,apple:true}}));
    expect(await availableSocialProviders()).toEqual(['google','apple']);
  });
  it('fails closed only for social providers when settings are missing, malformed or unavailable',async()=>{
    for(const result of [{external:{google:true}},{disable_signup:false,external:{google:'true'}},{disable_signup:true,external:{google:true}}]){
      fetchMock.mockResolvedValueOnce(settingsResponse(result));
      expect(await availableSocialProviders()).toEqual([]);
    }
    fetchMock.mockResolvedValueOnce(new Response('unavailable',{status:503}));
    expect(await availableSocialProviders()).toEqual([]);
    fetchMock.mockRejectedValueOnce(new Error('private upstream details'));
    expect(await availableSocialProviders()).toEqual([]);
  });
  it('does not start OAuth when either local signup gate is closed',async()=>{
    vi.stubEnv('ALLOW_PUBLIC_SIGNUP','false');
    expect(await availableSocialProviders()).toEqual([]);
    expect((await start({provider:'google'})).status).toBe(503);
    vi.stubEnv('ALLOW_PUBLIC_SIGNUP','true');vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY','');
    expect(await availableSocialProviders()).toEqual([]);
    expect((await start({provider:'google'})).status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(cookieJar.set).not.toHaveBeenCalled();
  });
});

describe('OAuth initiation boundaries',()=>{
  it('rejects foreign or missing origins before querying providers or writing a verifier',async()=>{
    for(const origin of ['https://foreign.invalid',null])expect((await start({provider:'google'},origin)).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();expect(cookieJar.set).not.toHaveBeenCalled();
  });
  it('rejects arbitrary providers and caller-supplied OAuth configuration',async()=>{
    for(const body of [{provider:'github'},{provider:'google',redirectTo:'https://foreign.invalid'},{provider:'apple',scopes:'admin'},{provider:'google',next:['/account']}]){
      expect((await start(body)).status).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();expect(cookieJar.set).not.toHaveBeenCalled();
  });
  it('rechecks disabled providers and closed backend signup before creating a PKCE flow',async()=>{
    expect((await start({provider:'apple'})).status).toBe(503);
    fetchMock.mockResolvedValue(settingsResponse({disable_signup:true,external:{google:true}}));
    expect((await start({provider:'google'})).status).toBe(503);
    expect(cookieJar.set).not.toHaveBeenCalled();
  });
  it('uses real SSR PKCE cookies and the canonical callback, preserving the requested page through exchange',async()=>{
    const next='/search?feed=following&q=V60&method=V60';
    const response=await start({provider:'google',next});
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    const payload=await readAuthorizePayload(response);
    expect(Object.keys(payload)).toEqual(['url']);
    const authorize=new URL(payload.url);
    expect(authorize.origin).toBe(project);expect(authorize.pathname).toBe('/auth/v1/authorize');
    expect(authorize.searchParams.get('provider')).toBe('google');
    expect(authorize.searchParams.get('code_challenge_method')).toBe('s256');
    const returned=new URL(authorize.searchParams.get('redirect_to')!);
    expect(returned.origin).toBe('https://goatlab.my');expect(returned.pathname).toBe('/auth/callback');
    expect(returned.searchParams.get('next')).toBe(next);expect(returned.searchParams.get('flow')).toBe('oauth');
    expect(cookieJar.set).toHaveBeenCalled();
    expect([...cookieJar.values.keys()].some(name=>name.includes('code-verifier'))).toBe(true);

    fetchMock.mockImplementation(async(input,options)=>{
      expect(String(input)).toBe(project+'/auth/v1/token?grant_type=pkce');
      const body=JSON.parse(String(options?.body));
      expect(body.auth_code).toBe('single-use-code');
      expect(createHash('sha256').update(body.code_verifier).digest('base64url')).toBe(authorize.searchParams.get('code_challenge'));
      expect(payload.url).not.toContain(body.code_verifier);
      return Response.json({access_token:'fixture-access-token',refresh_token:'fixture-refresh-token',expires_in:3600,token_type:'bearer',user:{id:'11111111-1111-4111-8111-111111111111',email:'fixture@example.com',email_confirmed_at:'2026-11-21',app_metadata:{provider:'google'},user_metadata:{}}});
    });
    returned.searchParams.set('code','single-use-code');
    const completed=await callback(new Request(returned,{headers:{'x-forwarded-host':'foreign.invalid'}}));
    expect(completed.status).toBe(303);
    expect(completed.headers.get('location')).toBe('https://goatlab.my'+next);
    expect(completed.headers.get('cache-control')).toContain('no-store');
    expect(completed.headers.get('referrer-policy')).toBe('no-referrer');
    expect([...cookieJar.values.keys()].some(name=>name.includes('auth-token')&&!name.includes('code-verifier'))).toBe(true);
  });
  it('preserves recipe intent and substitutes the local account destination for unsafe redirects',async()=>{
    for(const next of ['/recipes/new?template=v60-first-cup','//foreign.invalid','/%2f%2fforeign.invalid']){
      const response=await start({provider:'google',next});
      const destination=new URL(new URL((await readAuthorizePayload(response)).url).searchParams.get('redirect_to')!);
      expect(destination.origin).toBe('https://goatlab.my');
      expect(destination.searchParams.get('next')).toBe(next.startsWith('/recipes/')?next:null);
    }
  });
  it('rejects alternate origins, secrets, providers, callbacks and non-PKCE authorize URLs',()=>{
    const {url,redirect}=authorizeUrl();
    expect(validatedSocialAuthorizeUrl(url.href,'google',redirect.href)).toBe(url.href);
    const attempts=[
      new URL(url.href.replace(project,'https://foreign.invalid')),
      new URL(url.href.replace('https:','http:')),
      new URL(url.href.replace('https://','https://private:secret@')),
    ];
    for(const mutate of [
      (candidate:URL)=>{candidate.pathname='/auth/v1/token';},
      (candidate:URL)=>{candidate.searchParams.set('provider','apple');},
      (candidate:URL)=>{candidate.searchParams.set('redirect_to','https://foreign.invalid');},
      (candidate:URL)=>{candidate.searchParams.set('client_secret','private');},
      (candidate:URL)=>{candidate.searchParams.append('provider','google');},
      (candidate:URL)=>{candidate.searchParams.set('code_challenge_method','plain');},
      (candidate:URL)=>{candidate.searchParams.delete('code_challenge');},
      (candidate:URL)=>{candidate.hash='access_token=private';},
    ]){const candidate=new URL(url);mutate(candidate);attempts.push(candidate);}
    for(const attempt of attempts)expect(validatedSocialAuthorizeUrl(attempt.href,'google',redirect.href),attempt.origin+attempt.pathname).toBeNull();
  });
});

describe('OAuth failure callbacks',()=>{
  it('handles cancellation without exchanging a supplied code or exposing provider descriptions',async()=>{
    const response=await callback(new Request('https://goatlab.my/auth/callback?'+new URLSearchParams({flow:'oauth',next:'/explore?feed=following',code:'private-code',error:'access_denied',error_description:'private-provider-message'})));
    const location=response.headers.get('location')!;
    expect(location).toBe('https://goatlab.my/auth/login?next=%2Fexplore%3Ffeed%3Dfollowing&error=oauth');
    expect(location).not.toMatch(/private-code|private-provider-message/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('returns a generic local failure for a failed exchange, without logging OAuth details',async()=>{
    const errors=vi.spyOn(console,'error').mockImplementation(()=>{});
    expect((await start({provider:'google'})).status).toBe(200);
    fetchMock.mockReset().mockRejectedValue(new Error('private-network-secret'));
    const response=await callback(new Request('https://goatlab.my/auth/callback?flow=oauth&code=private-code&next=https://foreign.invalid'));
    expect(response.headers.get('location')).toBe('https://goatlab.my/auth/login?error=oauth');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(fetchMock).toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
  });
});
