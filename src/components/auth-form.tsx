'use client';
import {useEffect,useId,useRef,useState} from 'react';
import Script from 'next/script';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {ArrowRight,ArrowUpLeft,BookOpen,Bookmark,Eye,EyeOff,LockKeyhole,ShieldCheck,MailCheck} from 'lucide-react';
import {api,Field,Notice,useAction} from './shared';
import {normalizeEmailCode} from '@/lib/email-code';

declare global{interface Window{turnstile?:{render:(element:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void;reset:(id:string)=>void}}}
function Captcha({onToken}:{onToken:(value:string)=>void}){
  const element=useRef<HTMLDivElement>(null);const widget=useRef<string|undefined>(undefined);const [ready,setReady]=useState(false);
  useEffect(()=>{if(ready&&element.current&&window.turnstile){widget.current=window.turnstile.render(element.current,{sitekey:process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,callback:onToken,'expired-callback':()=>onToken(''),'error-callback':()=>onToken(''),language:'ar',size:'compact'});}return()=>{if(widget.current)window.turnstile?.remove(widget.current);};},[ready,onToken]);
  return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={()=>setReady(true)}/><div ref={element} className="captcha"/></>;
}

const authCopy:Record<string,{title:string;description:string;button:string}>={
  login:{title:'أهلًا بعودتك.',description:'دفتر وصفاتك، وتجاربك المحفوظة، بانتظارك.',button:'تسجيل الدخول'},
  signup:{title:'مكانك بين أهل القهوة.',description:'بريدك، كلمة مرور، ثم رمز تأكيد. ودفتر تجاربك يصبح جاهزًا.',button:'أنشئ حسابك مجانًا'},
  verify:{title:'خطوة أخيرة، ونبدأ.',description:'أدخل رمز التأكيد من 6 أرقام الذي وصلك بالبريد. تنتهي صلاحيته بعد 10 دقائق.',button:'أكّد البريد وادخل'},
  forgot:{title:'لنستعد حسابك.',description:'أدخل البريد المرتبط بحسابك لطلب رابط استعادة كلمة المرور.',button:'إرسال رابط الاستعادة'},
  reset:{title:'بداية جديدة لحسابك.',description:'اختر كلمة مرور قوية، وارجع لتجاربك بأمان.',button:'حفظ كلمة المرور'},
  resend:{title:'تأكيد بريدك الإلكتروني.',description:'اطلب رمز تأكيد جديد للبريد المرتبط بحسابك، ثم أدخله هنا.',button:'أرسل رمز التأكيد'},
};

export function AuthForm({mode,signupEnabled,confirmationError}:{mode:string;signupEnabled:boolean;confirmationError:boolean}){
  const router=useRouter();const action=useAction();const passwordId=useId();
  const [token,setToken]=useState('');const [captchaKey,setCaptchaKey]=useState(0);const [showPassword,setShowPassword]=useState(false);
  const [stage,setStage]=useState(mode);const [email,setEmail]=useState('');const [code,setCode]=useState('');const [cooldown,setCooldown]=useState(0);
  const heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{if(!cooldown)return;const timer=setTimeout(()=>setCooldown(value=>Math.max(0,value-1)),1000);return()=>clearTimeout(timer);},[cooldown]);
  useEffect(()=>{if(stage==='verify')heading.current?.focus();},[stage]);
  const copy=authCopy[stage]||authCopy.login;
  const closed=stage==='signup'&&!signupEnabled;const verifying=stage==='verify';
  const isPassword=['login','signup','reset'].includes(stage);const isEmail=stage!=='reset';
  const captcha=!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY&&stage!=='reset';
  function resetCaptcha(){setToken('');setCaptchaKey(value=>value+1);}

  return <div className="access-page">
    <Link className="interior-back" href="/explore"><ArrowRight size={17}/>العودة إلى الوصفات</Link>
    <section className="access-layout">
      <aside className="access-story"><div className="access-brand"><img src="/brand/mark-yellow.svg" alt="" width={72} height={72}/><span dir="ltr">GOAT JOURNEY<br/><b>COMMUNITY</b></span></div><div className="access-story-copy"><span className="overline">مكان لتجاربك، ومساحة لفضولك</span><h2>كل فنجان<br/>يكمّل الحكاية.</h2><p>ارجع لوصفتك، دوّن ملاحظة جديدة، أو خذ إلهامك من تجربة غيرك.</p></div><div className="access-benefits"><span><BookOpen size={20}/>وصفاتك ومسوداتك في مكان واحد</span><span><Bookmark size={20}/>تجارب محفوظة للفنجان القادم</span></div><span className="access-signature" dir="ltr">BREW. SHARE. REPEAT.</span></aside>
      <div className="access-panel">
        <span className="overline">{closed?'المجتمع في بدايته':stage==='login'?'دخول الأعضاء':'حسابك في Goat Journey'}</span>
        <h1 ref={heading} tabIndex={-1}>{closed?'التسجيل لم يُفتح بعد.':copy.title}</h1><p className="access-description">{closed?'نجهّز المجتمع لاستقبالكم. يمكنك التصفّح الآن، والعودة للمشاركة عندما يُفتح التسجيل.':copy.description}</p>
        {!closed&&(stage==='signup'||verifying)&&<><div className="free-account-note"><ShieldCheck size={17}/>حساب مجاني · بلا اشتراك أو رسوم</div><ol className="signup-progress" aria-label="خطوات إنشاء الحساب"><li aria-current={!verifying?'step':undefined}><span>1</span>بيانات الحساب</li><li aria-current={verifying?'step':undefined}><span>2</span>تأكيد البريد</li></ol></>}
        {confirmationError&&<Notice error>رابط التأكيد غير صالح أو انتهت مدته. اطلب رسالة جديدة.</Notice>}
        {closed?<div className="registration-closed"><span className="access-lock"><LockKeyhole size={27}/></span><h2>خذ جولة، وألهم فنجانك القادم.</h2><p>الوصفات المنشورة متاحة للجميع، دون إنشاء حساب.</p><Link className="button full" href="/explore">استكشف المجتمع<ArrowUpLeft size={20}/></Link><Link className="quiet-link" href="/auth/login">لديك حساب؟ تسجيل الدخول<ArrowUpLeft size={17}/></Link></div>:<>
          <form className="access-form" onSubmit={async e=>{
            e.preventDefault();const form=new FormData(e.currentTarget);const payload:Record<string,string>={};
            if(isEmail)payload.email=email.trim();if(isPassword)payload.password=String(form.get('password'));if(verifying)payload.token=normalizeEmailCode(code)||code;else if(token)payload.captchaToken=token;
            const result=await action.run(()=>api<{message?:string;confirmation?:boolean}>(`/api/auth/${stage}`,'POST',payload));
            if(!verifying)resetCaptcha();
            if(result){if(stage==='login'||stage==='reset'||verifying){router.push('/account');router.refresh();}else if(result.confirmation){setEmail(payload.email);setCode('');setStage('verify');setCooldown(60);setShowPassword(false);action.setMessage(result.message||'راجع بريدك لإدخال الرمز.');}else action.setMessage(result.message||'تم إرسال الطلب.');}
          }}>
            <fieldset disabled={action.busy}>
              {isEmail&&<Field label="البريد الإلكتروني"><input name="email" type="email" dir="ltr" autoComplete="email" required maxLength={254} placeholder="you@example.com" value={email} onChange={event=>{setEmail(event.target.value);if(verifying)setCode('');}}/></Field>}
              {isPassword&&<div className="field"><div className="password-heading"><label htmlFor={passwordId}>كلمة المرور</label>{stage==='login'&&<Link href="/auth/forgot">نسيت كلمة المرور؟</Link>}</div><div className="password-input"><input id={passwordId} name="password" type={showPassword?'text':'password'} dir="ltr" autoComplete={stage==='login'?'current-password':'new-password'} required minLength={stage==='login'?1:12} maxLength={128}/><button type="button" aria-label={showPassword?'إخفاء كلمة المرور':'إظهار كلمة المرور'} aria-pressed={showPassword} aria-controls={passwordId} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={20}/>:<Eye size={20}/>}</button></div>{stage!=='login'&&<small>12 حرفًا على الأقل. استخدم عبارة طويلة وفريدة.</small>}</div>}
              {verifying&&<Field label="رمز تأكيد البريد" hint="يمكنك لصق الرمز أو إدخاله بالأرقام العربية أو الإنجليزية."><input className="email-code-input" name="code" type="text" inputMode="numeric" dir="ltr" autoComplete="one-time-code" required pattern="[0-9٠-٩۰-۹]{6}" maxLength={6} placeholder="000000" value={code} onChange={event=>setCode(event.target.value)}/></Field>}
              {captcha&&!verifying&&<Captcha key={captchaKey} onToken={setToken}/>}
              <button className="button full" disabled={!verifying&&captcha&&!token}>{action.busy?'جاري التحقق…':copy.button}<ArrowUpLeft size={19}/></button>
            </fieldset>
          </form>
          {action.message&&<Notice error={action.failed}>{action.message}</Notice>}
          {verifying&&<div className="verification-help"><p><MailCheck size={18}/>لم يصل الرمز؟ راجع البريد غير المرغوب فيه، وتأكد من كتابة بريدك بشكل صحيح.</p>{captcha&&<Captcha key={captchaKey} onToken={setToken}/>}<button className="button secondary full" type="button" disabled={action.busy||cooldown>0||(captcha&&!token)||!email.trim()} onClick={async()=>{const result=await action.run(()=>api<{message:string}>('/api/auth/resend','POST',{email:email.trim(),...(token?{captchaToken:token}:{})}));resetCaptcha();setCooldown(60);if(result){setCode('');action.setMessage(result.message);}}}>{cooldown>0?`إعادة الإرسال بعد ${cooldown} ثانية`:'أرسل رمزًا جديدًا'}</button></div>}
          <div className="access-help">{stage==='login'?<><span>لم تؤكّد بريدك بعد؟</span><Link href="/auth/verify">تأكيد البريد</Link></>:stage==='resend'?<><Link href="/auth/verify">لديك رمز؟ أدخله هنا</Link><Link href="/auth/login">تسجيل الدخول</Link></>:<Link href="/auth/login">لديك حساب؟ تسجيل الدخول</Link>}</div>
          {stage==='login'&&<div className="access-registration"><LockKeyhole size={17}/><span>{signupEnabled?'جديد في المجتمع؟':'إنشاء الحسابات مغلق حاليًا.'} <Link href={signupEnabled?'/auth/signup':'/explore'}>{signupEnabled?'أنشئ حسابك مجانًا':'تصفّح الوصفات'}</Link></span></div>}
        </>}
        <p className="access-privacy"><ShieldCheck size={16}/>بريدك خاص ولا يظهر في ملفك العام.</p>
      </div>
    </section>
  </div>;
}
