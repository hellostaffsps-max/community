import type {SocialProvider} from './social-auth';

export function parseSocialProviderResponse(value:unknown):SocialProvider[]{
  if(typeof value!=='object'||value===null||Array.isArray(value)||!('providers' in value)||!Array.isArray(value.providers))return [];
  return value.providers.filter((provider:unknown):provider is SocialProvider=>provider==='google'||provider==='apple');
}

type SocialAuthFlowOptions={
  events:EventTarget;
  getLocation:()=>string;
  navigate:(url:string)=>void;
  onPending:(provider:SocialProvider|null)=>void;
  onError:(message:string)=>void;
  fetcher?:typeof fetch;
};
type Attempt={controller:AbortController;location:string};
const retryMessage='تعذّر بدء تسجيل الدخول. حاول مجددًا أو تابع بالبريد الإلكتروني.';

/** A request belongs to this mounted page and may not outlive its navigation. */
export function createSocialAuthFlow({events,getLocation,navigate,onPending,onError,fetcher=fetch}:SocialAuthFlowOptions){
  let current:Attempt|null=null;
  let disposed=false;
  let pageActive=true;

  function invalidate(){
    const previous=current;current=null;
    previous?.controller.abort();
  }
  function cancel(){
    invalidate();
    if(!disposed){onPending(null);onError('');}
  }
  function isCurrent(attempt:Attempt){
    return !disposed&&pageActive&&current===attempt&&!attempt.controller.signal.aborted;
  }
  const onPageHide=()=>{pageActive=false;cancel();};
  const onPageShow=(event:Event)=>{
    if((event as PageTransitionEvent).persisted){pageActive=true;cancel();}
  };
  const onHistoryChange=()=>cancel();
  events.addEventListener('pagehide',onPageHide);
  events.addEventListener('pageshow',onPageShow);
  events.addEventListener('popstate',onHistoryChange);

  return {
    get pending(){return current!==null;},
    cancel,
    async start(provider:SocialProvider,next:string){
      if(disposed||!pageActive||current)return;
      const attempt={controller:new AbortController(),location:getLocation()};
      current=attempt;onPending(provider);onError('');
      const signal=AbortSignal.any([attempt.controller.signal,AbortSignal.timeout(15000)]);
      try{
        const response=await fetcher('/api/auth/oauth',{
          method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',cache:'no-store',
          body:JSON.stringify({provider,...(next!=='/account'?{next}:{})}),signal,
        });
        if(!isCurrent(attempt))return;
        const result:unknown=await response.json();
        if(!isCurrent(attempt))return;
        if(signal.aborted||!response.ok||typeof result!=='object'||result===null||Array.isArray(result)||!('url' in result)||typeof result.url!=='string'||!result.url)throw new Error('oauth_unavailable');
        if(getLocation()!==attempt.location){cancel();return;}
        navigate(result.url);
        // Stay busy until navigation; pagehide/pageshow release a BFCache-restored form.
      }catch{
        if(!isCurrent(attempt))return;
        current=null;onPending(null);onError(retryMessage);
      }
    },
    dispose(){
      disposed=true;invalidate();
      events.removeEventListener('pagehide',onPageHide);
      events.removeEventListener('pageshow',onPageShow);
      events.removeEventListener('popstate',onHistoryChange);
    },
  };
}
