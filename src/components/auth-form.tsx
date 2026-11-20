'use client';
import {useEffect,useId,useRef,useState} from 'react';
import Script from 'next/script';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {ArrowRight,ArrowUpLeft,BookOpen,Bookmark,Eye,EyeOff,LockKeyhole,ShieldCheck} from 'lucide-react';
import {api,Field,Notice,useAction} from './shared';

declare global{interface Window{turnstile?:{render:(element:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void;reset:(id:string)=>void}}}
function Captcha({onToken}:{onToken:(value:string)=>void}){
  const element=useRef<HTMLDivElement>(null);const widget=useRef<string|undefined>(undefined);const [ready,setReady]=useState(false);
  useEffect(()=>{if(ready&&element.current&&window.turnstile){widget.current=window.turnstile.render(element.current,{sitekey:process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,callback:onToken,'expired-callback':()=>onToken(''),'error-callback':()=>onToken(''),language:'ar'});}return()=>{if(widget.current)window.turnstile?.remove(widget.current);};},[ready,onToken]);
  return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={()=>setReady(true)}/><div ref={element} className="captcha"/></>;
}

const authCopy:Record<string,{title:string;description:string;button:string}>={
  login:{title:'أهلًا بعودتك.',description:'دفتر وصفاتك، وتجاربك المحفوظة، بانتظارك.',button:'تسجيل الدخول'},
  signup:{title:'مكانك بين أهل القهوة.',description:'ابدأ دفتر تجاربك في مجتمع Goat Journey.',button:'إنشاء حساب'},
  forgot:{title:'لنستعد حسابك.',description:'أدخل البريد المرتبط بحسابك لطلب رابط استعادة كلمة المرور.',button:'إرسال رابط الاستعادة'},
  reset:{title:'بداية جديدة لحسابك.',description:'اختر كلمة مرور قوية، وارجع لتجاربك بأمان.',button:'حفظ كلمة المرور'},
  resend:{title:'تأكيد بريدك الإلكتروني.',description:'اطلب رابط تأكيد جديد للبريد المرتبط بحسابك.',button:'إرسال رابط التأكيد'},
};

export function AuthForm({mode,signupEnabled,confirmationError}:{mode:string;signupEnabled:boolean;confirmationError:boolean}){
  const router=useRouter();const action=useAction();const passwordId=useId();
  const [token,setToken]=useState('');const [captchaKey,setCaptchaKey]=useState(0);const [showPassword,setShowPassword]=useState(false);
  const copy=authCopy[mode]||authCopy.login;
  const closed=mode==='signup'&&!signupEnabled;
  const isPassword=['login','signup','reset'].includes(mode);const isEmail=mode!=='reset';
  const captcha=!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY&&mode!=='reset';

  return <div className="access-page">
    <Link className="interior-back" href="/explore"><ArrowRight size={17}/>العودة إلى الوصفات</Link>
    <section className="access-layout">
      <aside className="access-story"><div className="access-brand"><img src="/brand/mark-yellow.svg" alt="" width={72} height={72}/><span dir="ltr">GOAT JOURNEY<br/><b>COMMUNITY</b></span></div><div className="access-story-copy"><span className="overline">مكان لتجاربك، ومساحة لفضولك</span><h2>كل فنجان<br/>يكمّل الحكاية.</h2><p>ارجع لوصفتك، دوّن ملاحظة جديدة، أو خذ إلهامك من تجربة غيرك.</p></div><div className="access-benefits"><span><BookOpen size={20}/>وصفاتك ومسوداتك في مكان واحد</span><span><Bookmark size={20}/>تجارب محفوظة للفنجان القادم</span></div><span className="access-signature" dir="ltr">BREW. SHARE. REPEAT.</span></aside>
      <div className="access-panel">
        <span className="overline">{closed?'المجتمع في بدايته':mode==='login'?'دخول الأعضاء':'حسابك في Goat Journey'}</span>
        <h1>{closed?'التسجيل لم يُفتح بعد.':copy.title}</h1><p className="access-description">{closed?'نجهّز المجتمع لاستقبالكم. يمكنك التصفّح الآن، والعودة للمشاركة عندما يُفتح التسجيل.':copy.description}</p>
        {confirmationError&&<Notice error>رابط التأكيد غير صالح أو انتهت مدته. اطلب رسالة جديدة.</Notice>}
        {closed?<div className="registration-closed"><span className="access-lock"><LockKeyhole size={27}/></span><h2>خذ جولة، وألهم فنجانك القادم.</h2><p>الوصفات المنشورة متاحة للجميع، دون إنشاء حساب.</p><Link className="button full" href="/explore">استكشف المجتمع<ArrowUpLeft size={20}/></Link><Link className="quiet-link" href="/auth/login">لديك حساب؟ تسجيل الدخول<ArrowUpLeft size={17}/></Link></div>:<>
          <form className="access-form" onSubmit={async e=>{
            e.preventDefault();const form=new FormData(e.currentTarget);const payload:Record<string,string>={};
            if(isEmail)payload.email=String(form.get('email'));if(isPassword)payload.password=String(form.get('password'));if(token)payload.captchaToken=token;
            const result=await action.run(()=>api<{message?:string}>(`/api/auth/${mode}`,'POST',payload));setToken('');setCaptchaKey(k=>k+1);
            if(result){if(mode==='login'||mode==='reset'){router.push('/account');router.refresh();}else action.setMessage(result.message||'تم إرسال الطلب.');}
          }}>
            <fieldset disabled={action.busy}>
              {isEmail&&<Field label="البريد الإلكتروني"><input name="email" type="email" dir="ltr" autoComplete="email" required maxLength={254} placeholder="you@example.com"/></Field>}
              {isPassword&&<div className="field"><div className="password-heading"><label htmlFor={passwordId}>كلمة المرور</label>{mode==='login'&&<Link href="/auth/forgot">نسيت كلمة المرور؟</Link>}</div><div className="password-input"><input id={passwordId} name="password" type={showPassword?'text':'password'} dir="ltr" autoComplete={mode==='login'?'current-password':'new-password'} required minLength={mode==='login'?1:12} maxLength={128}/><button type="button" aria-label={showPassword?'إخفاء كلمة المرور':'إظهار كلمة المرور'} aria-pressed={showPassword} aria-controls={passwordId} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={20}/>:<Eye size={20}/>}</button></div>{mode!=='login'&&<small>12 حرفًا على الأقل. استخدم عبارة طويلة وفريدة.</small>}</div>}
              {captcha&&<Captcha key={captchaKey} onToken={setToken}/>}
              <button className="button full" disabled={captcha&&!token}>{action.busy?'جاري الإرسال…':copy.button}<ArrowUpLeft size={19}/></button>
            </fieldset>
          </form>
          {action.message&&<Notice error={action.failed}>{action.message}</Notice>}
          <div className="access-help">{mode==='login'?<><span>لم يصلك رابط التأكيد؟</span><Link href="/auth/resend">اطلب رابطًا جديدًا</Link></>:<Link href="/auth/login">العودة إلى تسجيل الدخول</Link>}</div>
          {mode==='login'&&<div className="access-registration"><LockKeyhole size={17}/><span>{signupEnabled?'جديد في المجتمع؟':'إنشاء الحسابات مغلق حاليًا.'} <Link href={signupEnabled?'/auth/signup':'/explore'}>{signupEnabled?'أنشئ حسابك':'تصفّح الوصفات'}</Link></span></div>}
        </>}
        <p className="access-privacy"><ShieldCheck size={16}/>بريدك خاص ولا يظهر في ملفك العام.</p>
      </div>
    </section>
  </div>;
}
