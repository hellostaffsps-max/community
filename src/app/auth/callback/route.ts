import { supabase } from '@/lib/supabase/server';
import { appOrigin } from '@/lib/env';
export async function GET(request:Request){
  const url=new URL(request.url);const code=url.searchParams.get('code');
  if(code){const client=await supabase();const {error}=await client.auth.exchangeCodeForSession(code);if(!error)return Response.redirect(`${appOrigin()}${url.searchParams.get('next')==='/auth/reset'?'/auth/reset':'/account'}`,303);}
  return Response.redirect(`${appOrigin()}/auth/login?error=confirmation`,303);
}
