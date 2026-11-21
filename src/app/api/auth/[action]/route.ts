import {z} from 'zod';
import {supabase} from '@/lib/supabase/server';
import {authSchema,emailSchema,emailCodeSchema} from '@/lib/validation';
import {assertOrigin,jsonBody,json,failure,HttpError} from '@/lib/http';
import {appOrigin,publicSignupEnabled} from '@/lib/env';
import {requireUser} from '@/lib/data';
import {safeAuthNext} from '@/lib/auth-navigation';

function checkCaptcha(token?:string) {
  if(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY&&!token?.trim())throw new HttpError(400,'أكمل التحقق الأمني.');
}
function emailError(error:{status?:number;code?:string}|null) {
  if(error?.status===429)throw new HttpError(429,'انتظر قليلًا قبل طلب رمز أو رسالة أخرى.');
  if(error&&((error.status||0)>=500||['email_address_not_authorized','email_address_not_allowed'].includes(error.code||'')))throw new HttpError(503,'تعذّر إرسال البريد الآن. حاول لاحقًا.');
}

export async function POST(request:Request,context:{params:Promise<{action:string}>}) {
  try {
    assertOrigin(request);
    const {action}=await context.params;
    if(!['login','logout','signup','verify','resend','forgot','reset'].includes(action))throw new HttpError(404,'الطلب غير موجود.');
    // The provider also disables signup until SMTP and CAPTCHA are configured.
    if(action==='signup'&&!publicSignupEnabled())throw new HttpError(503,'التسجيل لم يُفتح بعد.');
    const client=await supabase();
    if(action==='logout') {
      const {error}=await client.auth.signOut();
      if(error)throw error;
      return json({ok:true});
    }
    const {next,...body}=z.record(z.string(),z.unknown()).parse(await jsonBody(request));
    const destination=safeAuthNext(next);
    const callback=new URL('/auth/callback',appOrigin());
    if(destination!=='/account')callback.searchParams.set('next',destination);
    if(action==='reset') {
      await requireUser(client);
      const {password}=authSchema.pick({password:true}).parse(body);
      const {error}=await client.auth.updateUser({password});
      if(error)throw error;
      return json({ok:true});
    }
    if(action==='verify') {
      const {email,token}=emailCodeSchema.parse(body);
      const {data,error}=await client.auth.verifyOtp({email,token,type:'email'});
      if(error)throw new HttpError(error.status===429?429:400,error.status===429?'محاولات كثيرة. انتظر قليلًا قبل المحاولة مجددًا.':'الرمز غير صحيح أو انتهت صلاحيته. راجعه أو اطلب رمزًا جديدًا.');
      if(!data.session||!data.user?.email_confirmed_at) {
        if(data.session)await client.auth.signOut({scope:'local'});
        throw new HttpError(400,'لم يكتمل تأكيد بريدك. اطلب رمزًا جديدًا.');
      }
      // SSR cookies carry the session; never return tokens to application JavaScript.
      return json({ok:true,next:destination});
    }
    if(action==='forgot'||action==='resend') {
      const input=emailSchema.parse(body);
      checkCaptcha(input.captchaToken);
      const recovery=new URL('/auth/callback',appOrigin());recovery.searchParams.set('next','/auth/reset');if(destination!=='/account')recovery.searchParams.set('returnTo',destination);
      const result=action==='forgot'
        ?await client.auth.resetPasswordForEmail(input.email,{redirectTo:recovery.href,captchaToken:input.captchaToken})
        :await client.auth.resend({type:'signup',email:input.email,options:{emailRedirectTo:callback.href,captchaToken:input.captchaToken}});
      emailError(result.error);
      // Keep unknown and existing email addresses indistinguishable.
      return json(action==='resend'
        ?{confirmation:true,message:'إذا كان البريد بانتظار التأكيد، سيصلك رمز جديد.'}
        :{message:'إذا كان البريد مؤهلًا، ستصلك رسالة بخطوات الاستعادة.'});
    }
    if(action==='signup') {
      const input=authSchema.parse(body);
      checkCaptcha(input.captchaToken);
      const {data,error}=await client.auth.signUp({email:input.email,password:input.password,options:{emailRedirectTo:callback.href,captchaToken:input.captchaToken}});
      emailError(error);
      if(error)throw new HttpError(400,'تعذّر التسجيل. تحقق من البيانات أو جرّب تسجيل الدخول.');
      if(data.session) {
        await client.auth.signOut({scope:'local'});
        throw new HttpError(503,'تعذّر بدء تأكيد البريد. حاول لاحقًا.');
      }
      return json({confirmation:true,message:'راجع بريدك وأدخل رمز التأكيد لإكمال حسابك المجاني.'});
    }
    // Existing accounts may have shorter passwords; creation and reset require 12.
    const input=authSchema.extend({password:z.string().min(1).max(128)}).parse(body);
    checkCaptcha(input.captchaToken);
    const {error}=await client.auth.signInWithPassword({email:input.email,password:input.password,options:{captchaToken:input.captchaToken}});
    if(error)throw new HttpError(error.status===429?429:401,error.code==='email_not_confirmed'?'أكّد بريدك أولًا. افتح «تأكيد البريد» لإدخال الرمز أو طلب رمز جديد.':'تعذّر تسجيل الدخول. راجع البريد وكلمة المرور.');
    return json({ok:true});
  } catch(error) {return failure(error);}
}
