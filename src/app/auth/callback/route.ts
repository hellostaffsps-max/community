import {supabase} from '@/lib/supabase/server';
import {appOrigin} from '@/lib/env';
import {authHref,safeAuthNext} from '@/lib/auth-navigation';

function localRedirect(path:string){
  return new Response(null,{status:303,headers:{Location:new URL(path,appOrigin()).href,'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
}

export async function GET(request:Request){
  const url=new URL(request.url);const code=url.searchParams.get('code');
  const recovering=url.searchParams.get('next')==='/auth/reset';
  const destination=safeAuthNext(url.searchParams.get(recovering?'returnTo':'next'));
  const oauth=url.searchParams.get('flow')==='oauth';
  if(!url.searchParams.has('error')&&code&&code.length<=2048){
    try{
      const client=await supabase();const {error}=await client.auth.exchangeCodeForSession(code);
      if(!error)return localRedirect(recovering?authHref('reset',destination):destination);
    }catch{
      // A failed exchange returns to login without exposing its code or provider error.
    }
  }
  const failure=new URL(authHref('login',destination),appOrigin());
  failure.searchParams.set('error',oauth?'oauth':'confirmation');
  return localRedirect(failure.pathname+failure.search);
}
