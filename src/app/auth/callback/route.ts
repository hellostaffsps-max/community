import { supabase } from '@/lib/supabase/server';
import { appOrigin } from '@/lib/env';
import {authHref,safeAuthNext} from '@/lib/auth-navigation';
export async function GET(request:Request){
  const url=new URL(request.url);const code=url.searchParams.get('code');
  const recovering=url.searchParams.get('next')==='/auth/reset';
  const destination=safeAuthNext(url.searchParams.get(recovering?'returnTo':'next'));
  if(code){const client=await supabase();const {error}=await client.auth.exchangeCodeForSession(code);if(!error)return Response.redirect(`${appOrigin()}${recovering?authHref('reset',destination):destination}`,303);}
  const failure=new URL(authHref('login',destination),appOrigin());failure.searchParams.set('error','confirmation');
  return Response.redirect(failure.href,303);
}
