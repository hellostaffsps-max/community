import { supabase } from '@/lib/supabase/server';
import { appOrigin } from '@/lib/env';
import {authHref,safeAuthNext} from '@/lib/auth-navigation';
export async function GET(request:Request){
  const url=new URL(request.url);const hash=url.searchParams.get('token_hash');const type=url.searchParams.get('type');
  const destination=safeAuthNext(url.searchParams.get(type==='recovery'?'returnTo':'next'));
  if(hash&&(type==='signup'||type==='recovery'||type==='email')){
    const client=await supabase();const {error}=await client.auth.verifyOtp({token_hash:hash,type});
    if(!error)return Response.redirect(`${appOrigin()}${type==='recovery'?authHref('reset',destination):destination}`,303);
  }
  const failure=new URL(authHref('login',destination),appOrigin());failure.searchParams.set('error','confirmation');return Response.redirect(failure.href,303);
}
