'use client';
import {useEffect,useRef,useState} from 'react';
import Script from 'next/script';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {api,Field,Notice,useAction} from './shared';
declare global{interface Window{turnstile?:{render:(element:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void;reset:(id:string)=>void}}}
function Captcha({onToken}:{onToken:(value:string)=>void}){
  const element=useRef<HTMLDivElement>(null);const widget=useRef<string|undefined>(undefined);const [ready,setReady]=useState(false);
  useEffect(()=>{if(ready&&element.current&&window.turnstile){widget.current=window.turnstile.render(element.current,{sitekey:process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,callback:onToken,'expired-callback':()=>onToken(''),'error-callback':()=>onToken(''),language:'ar'});}return()=>{if(widget.current)window.turnstile?.remove(widget.current);};},[ready,onToken]);
  return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={()=>setReady(true)}/><div ref={element} className="captcha"/></>;
}
export function AuthForm({mode,signupEnabled,confirmationError}:{mode:string;signupEnabled:boolean;confirmationError:boolean}){
  const router=useRouter();const action=useAction();const [token,setToken]=useState('');const [captchaKey,setCaptchaKey]=useState(0);
  const titles:Record<string,string>={login:'أهلًا بعودتك.',signup:'مكانك بين أهل القهوة.',forgot:'لنستعد حسابك.',reset:'كلمة مرور جديدة.',resend:'تأكيد بريدك الإلكتروني.'};
  const isPassword=['login','signup','reset'].includes(mode);const isEmail=mode!=='reset';
  const captcha=!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY&&mode!=='reset';
  return <section className="auth-shell"><div className="auth-aside"><span className="eyebrow">GOAT JOURNEY COMMUNITY</span><h1>الخبرة تزيد <br/>لما نشاركها.</h1><p>من أول جرعة إلى آخر رشفة، لكل باريستا تجربة تستحق أن تُروى.</p><span className="large-ring" aria-hidden="true"/></div>
    <div className="auth-panel"><Link className="text-link" href="/">← العودة للمجتمع</Link><h2>{titles[mode]||titles.login}</h2><p>ابدأ من حيث انتهت آخر تجربة.</p>
    {mode==='signup'&&!signupEnabled&&<Notice>التسجيل لم يُفتح بعد. نجهّز المجتمع لاستقبالكم.</Notice>}
    {confirmationError&&<Notice error>رابط التأكيد غير صالح أو انتهت مدته. اطلب رسالة جديدة.</Notice>}
    <form onSubmit={async e=>{e.preventDefault();const form=new FormData(e.currentTarget);const payload:Record<string,string>={};if(isEmail)payload.email=String(form.get('email'));if(isPassword)payload.password=String(form.get('password'));if(token)payload.captchaToken=token;
      const result=await action.run(()=>api<{message?:string}>(`/api/auth/${mode}`,'POST',payload));setToken('');setCaptchaKey(k=>k+1);
      if(result){if(mode==='login'||mode==='reset'){router.push('/account');router.refresh();}else action.setMessage(result.message||'تم إرسال الطلب.');}}}>
      <fieldset disabled={action.busy||(mode==='signup'&&!signupEnabled)}>
      {isEmail&&<Field label="البريد الإلكتروني"><input name="email" type="email" dir="ltr" autoComplete="email" required maxLength={254} placeholder="you@example.com"/></Field>}
      {isPassword&&<Field label="كلمة المرور" hint={mode==='login'?undefined:'12 حرفًا على الأقل، ويفضّل استخدام عبارة طويلة وفريدة.'}><input name="password" type="password" dir="ltr" autoComplete={mode==='login'?'current-password':'new-password'} required minLength={mode==='login'?1:12} maxLength={128}/></Field>}
      {captcha&&<Captcha key={captchaKey} onToken={setToken}/>}
      <button className="button full" disabled={captcha&&!token}>{action.busy?'جاري الإرسال…':mode==='login'?'تسجيل الدخول':mode==='signup'?'إنشاء حساب':mode==='reset'?'حفظ كلمة المرور':'إرسال الرسالة'}</button>
      </fieldset>
    </form>
    {action.message&&<Notice error={action.failed}>{action.message}</Notice>}
    <div className="auth-links"><Link href="/auth/login">تسجيل الدخول</Link><Link href="/auth/signup">إنشاء حساب</Link><Link href="/auth/forgot">نسيت كلمة المرور؟</Link><Link href="/auth/resend">إعادة إرسال التأكيد</Link></div>
    <small>بريدك خاص ولا يظهر في ملفك العام.</small></div>
  </section>;
}
