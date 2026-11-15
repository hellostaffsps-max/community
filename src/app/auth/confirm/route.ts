import { supabase } from '@/lib/supabase/server';
import { appOrigin } from '@/lib/env';
export async function GET(request:Request){
  const url=new URL(request.url);const hash=url.searchParams.get('token_hash');const type=url.searchParams.get('type');
  if(hash&&(type==='signup'||type==='recovery'||type==='email')){
    const client=await supabase();const {error}=await client.auth.verifyOtp({token_hash:hash,type});
    if(!error)return Response.redirect(`${appOrigin()}${type==='recovery'?'/auth/reset':'/account'}`,303);
  }
  return Response.redirect(`${appOrigin()}/auth/login?error=confirmation`,303);
}
