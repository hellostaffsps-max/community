import {afterEach,describe,expect,it,vi} from 'vitest';
import {createSocialAuthFlow,parseSocialProviderResponse} from '../src/lib/social-auth-flow';

function deferred<T>(){
  let resolve!:(value:T)=>void;let reject!:(reason:unknown)=>void;
  const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});
  return {promise,resolve,reject};
}
const authorize='https://feyugmltesjdwejbzgzs.supabase.co/auth/v1/authorize?provider=google';
const instances:ReturnType<typeof createSocialAuthFlow>[]=[];
function setup(fetcher=vi.fn<typeof fetch>()){
  const events=new EventTarget();const onPending=vi.fn();const onError=vi.fn();const navigate=vi.fn();
  let location='/auth/login?next=%2Frecipes%2Fnew';
  const flow=createSocialAuthFlow({events,fetcher,getLocation:()=>location,onPending,onError,navigate});
  instances.push(flow);
  return {flow,events,fetcher,onPending,onError,navigate,setLocation:(value:string)=>{location=value;}};
}
function restore(events:EventTarget,persisted:boolean){
  const event=new Event('pageshow');Object.defineProperty(event,'persisted',{value:persisted});events.dispatchEvent(event);
}
afterEach(()=>{for(const flow of instances.splice(0))flow.dispose();});

describe('social sign-in request lifecycle',()=>{
  it('allows only one request at a time and releases a successful navigation after a persisted pageshow',async()=>{
    const request=deferred<Response>();const state=setup();
    state.fetcher.mockReturnValueOnce(request.promise).mockResolvedValueOnce(Response.json({url:authorize}));
    const first=state.flow.start('google','/recipes/new?template=v60-first-cup');
    await state.flow.start('google','/recipes/new');
    expect(state.fetcher).toHaveBeenCalledTimes(1);
    expect(state.flow.pending).toBe(true);
    expect(JSON.parse(String(state.fetcher.mock.calls[0][1]?.body))).toEqual({provider:'google',next:'/recipes/new?template=v60-first-cup'});
    request.resolve(Response.json({url:authorize}));await first;
    expect(state.navigate).toHaveBeenCalledExactlyOnceWith(authorize);
    restore(state.events,false);
    expect(state.flow.pending).toBe(true);
    restore(state.events,true);
    expect(state.flow.pending).toBe(false);
    expect(state.onPending).toHaveBeenLastCalledWith(null);
    await state.flow.start('google','/account');
    expect(state.fetcher).toHaveBeenCalledTimes(2);
  });

  it('aborts on unmount and ignores a late response even if the transport ignores cancellation',async()=>{
    const request=deferred<Response>();const state=setup();
    state.fetcher.mockReturnValue(request.promise);
    const pending=state.flow.start('google','/account');
    const signal=state.fetcher.mock.calls[0][1]?.signal;
    state.flow.dispose();
    expect(signal?.aborted).toBe(true);
    const updates=state.onPending.mock.calls.length;const errors=state.onError.mock.calls.length;
    request.resolve(Response.json({url:authorize}));await pending;
    state.events.dispatchEvent(new Event('pagehide'));restore(state.events,true);
    await state.flow.start('google','/account');
    expect(state.navigate).not.toHaveBeenCalled();
    expect(state.fetcher).toHaveBeenCalledTimes(1);
    expect(state.onPending).toHaveBeenCalledTimes(updates);
    expect(state.onError).toHaveBeenCalledTimes(errors);
  });

  it('does not let a pre-BFCache response redirect or clear the next attempt after returning',async()=>{
    const oldRequest=deferred<Response>();const newRequest=deferred<Response>();const state=setup();
    state.fetcher.mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newRequest.promise);
    const old=state.flow.start('google','/account');
    const oldSignal=state.fetcher.mock.calls[0][1]?.signal;
    state.events.dispatchEvent(new Event('pagehide'));
    expect(oldSignal?.aborted).toBe(true);
    await state.flow.start('google','/account');
    expect(state.fetcher).toHaveBeenCalledTimes(1);
    restore(state.events,true);
    const fresh=state.flow.start('google','/search?q=V60');
    oldRequest.resolve(Response.json({url:authorize+'&old=1'}));await old;
    expect(state.flow.pending).toBe(true);
    expect(state.onPending).toHaveBeenLastCalledWith('google');
    expect(state.navigate).not.toHaveBeenCalled();
    newRequest.resolve(Response.json({url:authorize+'&new=1'}));await fresh;
    expect(state.navigate).toHaveBeenCalledExactlyOnceWith(authorize+'&new=1');
  });

  it('checks the active attempt again after asynchronous response body parsing',async()=>{
    const body=deferred<{url:string}>();const state=setup();
    const response=Response.json({});
    const parse=vi.spyOn(response,'json').mockReturnValue(body.promise);
    state.fetcher.mockResolvedValue(response);
    const pending=state.flow.start('google','/account');
    await Promise.resolve();
    expect(parse).toHaveBeenCalled();
    state.flow.cancel();
    body.resolve({url:authorize});await pending;
    expect(state.navigate).not.toHaveBeenCalled();
    expect(state.flow.pending).toBe(false);
    expect(state.onError).toHaveBeenLastCalledWith('');
  });

  it('cancels a completed request when the route changed without an unmount event',async()=>{
    const request=deferred<Response>();const state=setup();
    state.fetcher.mockReturnValue(request.promise);
    const pending=state.flow.start('google','/account');
    state.setLocation('/explore');
    request.resolve(Response.json({url:authorize}));await pending;
    expect(state.navigate).not.toHaveBeenCalled();
    expect(state.flow.pending).toBe(false);
    expect(state.onPending).toHaveBeenLastCalledWith(null);
  });

  it('aborts immediately on history navigation and never displays a cancellation as an auth failure',async()=>{
    const request=deferred<Response>();const state=setup();
    state.fetcher.mockReturnValue(request.promise);
    const pending=state.flow.start('google','/account');
    state.events.dispatchEvent(new Event('popstate'));
    expect(state.fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
    request.reject(new DOMException('cancelled','AbortError'));await pending;
    expect(state.onError).toHaveBeenLastCalledWith('');
    expect(state.navigate).not.toHaveBeenCalled();
    expect(state.flow.pending).toBe(false);
  });

  it('releases the current attempt after failure so retry or email sign-in remains available',async()=>{
    const state=setup();
    state.fetcher.mockRejectedValueOnce(new Error('private upstream detail')).mockResolvedValueOnce(Response.json({url:authorize}));
    await state.flow.start('google','/account');
    expect(state.flow.pending).toBe(false);
    expect(state.onPending).toHaveBeenLastCalledWith(null);
    expect(state.onError.mock.lastCall?.[0]).not.toContain('private upstream detail');
    expect(state.onError.mock.lastCall?.[0]).toContain('بالبريد الإلكتروني');
    await state.flow.start('google','/account');
    expect(state.navigate).toHaveBeenCalledExactlyOnceWith(authorize);
  });
});

describe('untrusted social authentication response bodies',()=>{
  it('shows only allowed providers from a valid object containing a provider array',()=>{
    for(const payload of [null,[],true,'google',{}, {providers:'google'}, {providers:{google:true}}])expect(parseSocialProviderResponse(payload)).toEqual([]);
    expect(parseSocialProviderResponse({providers:['google',null,'github',true,'apple',{provider:'google'}]})).toEqual(['google','apple']);
  });

  it('rejects malformed authorize responses without navigation and releases the form for retry',async()=>{
    const state=setup();
    for(const payload of [null,[],true,'https://foreign.invalid',{}, {url:null}, {url:42}, {url:['https://foreign.invalid']}, {url:''}]){
      state.fetcher.mockResolvedValueOnce(Response.json(payload));
      await state.flow.start('google','/account');
      expect(state.flow.pending).toBe(false);
      expect(state.onPending).toHaveBeenLastCalledWith(null);
      expect(state.navigate).not.toHaveBeenCalled();
      expect(state.onError.mock.lastCall?.[0]).toContain('بالبريد الإلكتروني');
    }
    state.fetcher.mockResolvedValueOnce(Response.json({url:authorize}));
    await state.flow.start('google','/account');
    expect(state.navigate).toHaveBeenCalledExactlyOnceWith(authorize);
  });
});
