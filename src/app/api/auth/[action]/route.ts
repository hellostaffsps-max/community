import { z } from 'zod';
import { supabase } from '@/lib/supabase/server';
import { authSchema,emailSchema } from '@/lib/validation';
import { assertOrigin,jsonBody,json,failure,HttpError } from '@/lib/http';
import { appOrigin } from '@/lib/env';
import { requireUser } from '@/lib/data';
export async function POST(request:Request,context:{params:Promise<{action:string}>}){
  try{
    assertOrigin(request);const {action}=await context.params;const client=await supabase();
    if(action==='logout'){const {error}=await client.auth.signOut();if(error)throw error;return json({ok:true});}
    const body=await jsonBody(request);
    if(action==='reset'){
      await requireUser(client);const {password}=authSchema.pick({password:true}).parse(body);const {error}=await client.auth.updateUser({password});if(error)throw error;return json({ok:true});
    }
    if(['forgot','resend'].includes(action)){
      const input=emailSchema.parse(body);
      if(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY&&!input.captchaToken)throw new HttpError(400,'أكمل التحقق الأمني.');
      const result=action==='forgot'?await client.auth.resetPasswordForEmail(input.email,{redirectTo:`${appOrigin()}/auth/callback?next=/auth/reset`,captchaToken:input.captchaToken}):await client.auth.resend({type:'signup',email:input.email,options:{emailRedirectTo:`${appOrigin()}/auth/callback`,captchaToken:input.captchaToken}});
      if(result.error?.status===429)throw new HttpError(429,'انتظر قليلًا قبل طلب رسالة أخرى.');
      if(result.error&&result.error.status&&result.error.status>=500)throw new HttpError(503,'تعذّر إرسال الرسالة الآن. حاول لاحقًا.');
      // Same response for existing and unknown addresses.
      return json({message:'إذا كان البريد مؤهلًا، ستصلك رسالة بالخطوات التالية.'});
    }
    if(action==='signup'){
      if(process.env.ALLOW_PUBLIC_SIGNUP!=='true')throw new HttpError(503,'التسجيل لم يُفتح بعد.');
      const input=authSchema.parse(body);
      if(!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY||!input.captchaToken)throw new HttpError(400,'أكمل التحقق الأمني.');
      const {error}=await client.auth.signUp({email:input.email,password:input.password,options:{emailRedirectTo:`${appOrigin()}/auth/callback`,captchaToken:input.captchaToken}});
      if(error)throw new HttpError(error.status===429?429:400,error.status===429?'انتظر قليلًا قبل المحاولة مجددًا.':'تعذّر التسجيل. تحقق من البيانات أو جرّب تسجيل الدخول.');
      return json({message:'راجع بريدك لتأكيد الحساب قبل تسجيل الدخول.'});
    }
    if(action==='login'){
      // Existing accounts may have shorter passwords; creation and reset require 12.
      const input=authSchema.extend({password:z.string().min(1).max(128)}).parse(body);
      if(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY&&!input.captchaToken)throw new HttpError(400,'أكمل التحقق الأمني.');
      const {error}=await client.auth.signInWithPassword({email:input.email,password:input.password,options:{captchaToken:input.captchaToken}});
      if(error)throw new HttpError(error.status===429?429:401,'تعذّر تسجيل الدخول. راجع البريد وكلمة المرور وتأكيد الحساب.');return json({ok:true});
    }
    throw new HttpError(404,'الطلب غير موجود.');
  }catch(error){return failure(error);}
}
