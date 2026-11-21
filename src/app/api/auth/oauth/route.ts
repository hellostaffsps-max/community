import {z} from 'zod';
import {appOrigin,publicSignupEnabled} from '@/lib/env';
import {supabase} from '@/lib/supabase/server';
import {safeAuthNext} from '@/lib/auth-navigation';
import {availableSocialProviders,socialProviders,validatedSocialAuthorizeUrl} from '@/lib/social-auth';
import {assertOrigin,failure,HttpError,json,jsonBody} from '@/lib/http';

const inputSchema=z.object({provider:z.enum(socialProviders),next:z.string().max(2048).optional()}).strict();
const unavailable='تسجيل الدخول بهذه الخدمة غير متاح الآن. يمكنك المتابعة بالبريد الإلكتروني.';

export async function POST(request:Request){
  try{
    assertOrigin(request);
    const input=inputSchema.parse(await jsonBody(request));
    if(!publicSignupEnabled())throw new HttpError(503,unavailable);
    if(!(await availableSocialProviders()).includes(input.provider))throw new HttpError(503,unavailable);
    const destination=safeAuthNext(input.next);
    const callback=new URL('/auth/callback',appOrigin());
    callback.searchParams.set('flow','oauth');
    if(destination!=='/account')callback.searchParams.set('next',destination);
    const client=await supabase();
    // The SSR client writes the PKCE verifier via Next's response cookies.
    const {data,error}=await client.auth.signInWithOAuth({
      provider:input.provider,options:{redirectTo:callback.href,skipBrowserRedirect:true},
    });
    if(error)throw new HttpError(503,unavailable);
    const url=validatedSocialAuthorizeUrl(data.url,input.provider,callback.href);
    if(!url)throw new HttpError(503,unavailable);
    return json({url});
  }catch(error){
    // Never log or return provider payloads, redirect parameters or OAuth codes.
    return failure(error instanceof HttpError||error instanceof z.ZodError?error:new HttpError(503,unavailable));
  }
}
