'use client';
import {useEffect,useId,useRef,useState} from 'react';
import Script from 'next/script';
import Image from 'next/image';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Eye,EyeOff,LockKeyhole,ShieldCheck,MailCheck} from 'lucide-react';
import {api,Field,Notice,useAction} from './shared';
import {normalizeEmailCode} from '@/lib/email-code';
import {authHref,safeAuthNext} from '@/lib/auth-navigation';
import type {SocialProvider} from '@/lib/social-auth';
import {createSocialAuthFlow,parseSocialProviderResponse} from '@/lib/social-auth-flow';

declare global{interface Window{turnstile?:{render:(element:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void;reset:(id:string)=>void}}}
function Captcha({onToken}:{onToken:(value:string)=>void}){
  const element=useRef<HTMLDivElement>(null);const widget=useRef<string|undefined>(undefined);const [ready,setReady]=useState(false);
  useEffect(()=>{if(ready&&element.current&&window.turnstile){widget.current=window.turnstile.render(element.current,{sitekey:process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,callback:onToken,'expired-callback':()=>onToken(''),'error-callback':()=>onToken(''),language:'ar',size:'compact',appearance:'interaction-only',execution:'render'});}return()=>{if(widget.current)window.turnstile?.remove(widget.current);};},[ready,onToken]);
  return <><Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" onReady={()=>setReady(true)}/><div ref={element} className="journey-auth-captcha"/></>;
}

const authCopy:Record<string,{title:string;description:string;button:string}>={
  login:{title:'أهلًا بعودتك.',description:'سجّل دخولك إلى Goat Journey.',button:'تسجيل الدخول'},
  signup:{title:'انضم إلى أهل القهوة.',description:'وصفاتك، وتجاربك، ومجتمع يشاركك الشغف.',button:'أنشئ حسابك مجانًا'},
  verify:{title:'تأكيد بريدك.',description:'أدخل الرمز من 6 أرقام الذي وصلك بالبريد. صلاحيته 10 دقائق.',button:'أكّد البريد وادخل'},
  forgot:{title:'نسيت كلمة المرور؟',description:'سنرسل لك رابطًا لاستعادة الوصول إلى حسابك.',button:'إرسال رابط الاستعادة'},
  reset:{title:'كلمة مرور جديدة.',description:'اختر كلمة مرور لحسابك، ثم عد إلى وصفاتك.',button:'حفظ كلمة المرور'},
  resend:{title:'تأكيد بريدك.',description:'اطلب رمزًا جديدًا لإكمال حسابك.',button:'أرسل رمز التأكيد'},
};

export function AuthForm({mode,signupEnabled,confirmationError,oauthError=false,returnTo}:{mode:string;signupEnabled:boolean;confirmationError:boolean;oauthError?:boolean;returnTo?:string}){
  const router=useRouter();const action=useAction();const passwordId=useId();const headingId=useId();const destination=safeAuthNext(returnTo);
  const [token,setToken]=useState('');const [captchaKey,setCaptchaKey]=useState(0);const [showPassword,setShowPassword]=useState(false);
  const [stage,setStage]=useState(mode);const [email,setEmail]=useState('');const [code,setCode]=useState('');const [cooldown,setCooldown]=useState(0);
  const [providers,setProviders]=useState<SocialProvider[]>([]);const [socialBusy,setSocialBusy]=useState<SocialProvider|null>(null);const [socialError,setSocialError]=useState('');
  const socialAttempt=useRef<ReturnType<typeof createSocialAuthFlow>|null>(null);
  const showSocial=(stage==='login'||stage==='signup')&&signupEnabled;
  useEffect(()=>{
    if(!showSocial)return;
    const abort=new AbortController();
    void fetch('/api/auth/providers',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.any([abort.signal,AbortSignal.timeout(7000)])})
      .then(async response=>response.ok?response.json():null)
      .then((data:unknown)=>{if(!abort.signal.aborted)setProviders(parseSocialProviderResponse(data));})
      .catch(()=>{if(!abort.signal.aborted)setProviders([]);});
    return()=>abort.abort();
  },[showSocial]);
  useEffect(()=>{
    setSocialBusy(null);
    if(!showSocial)return;
    const flow=createSocialAuthFlow({
      events:window,getLocation:()=>window.location.pathname+window.location.search,
      navigate:url=>window.location.assign(url),onPending:setSocialBusy,onError:setSocialError,
    });
    socialAttempt.current=flow;
    function cancelForLink(event:MouseEvent){
      if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const anchor=event.target instanceof Element?event.target.closest('a[href]'):null;
      if(!(anchor instanceof HTMLAnchorElement)||anchor.hasAttribute('download')||(anchor.target&&anchor.target!=='_self'))return;
      let target:URL;try{target=new URL(anchor.href,window.location.href);}catch{return;}
      if(!['http:','https:'].includes(target.protocol))return;
      if(target.origin!==window.location.origin||target.pathname!==window.location.pathname||target.search!==window.location.search)flow.cancel();
    }
    // Cancel before Next's Link transition commits; the old screen can remain mounted meanwhile.
    document.addEventListener('click',cancelForLink,true);
    return()=>{
      document.removeEventListener('click',cancelForLink,true);
      flow.dispose();
      if(socialAttempt.current===flow)socialAttempt.current=null;
    };
  },[showSocial,destination]);
  async function startSocial(provider:SocialProvider){
    if(action.busy||!showSocial||!providers.includes(provider))return;
    await socialAttempt.current?.start(provider,destination);
  }
  const heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{if(!cooldown)return;const timer=setTimeout(()=>setCooldown(value=>Math.max(0,value-1)),1000);return()=>clearTimeout(timer);},[cooldown]);
  useEffect(()=>{if(stage==='verify')heading.current?.focus();},[stage]);
  const copy=authCopy[stage]||authCopy.login;
  const closed=stage==='signup'&&!signupEnabled;const verifying=stage==='verify';
  const isPassword=['login','signup','reset'].includes(stage);const isEmail=stage!=='reset';
  const captcha=!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY&&stage!=='reset';
  function resetCaptcha(){setToken('');setCaptchaKey(value=>value+1);}

  return <section className="journey-auth-card" aria-labelledby={headingId}>
    <header className="journey-auth-heading">
      <h1 id={headingId} ref={heading} tabIndex={-1}>{closed?'التسجيل لم يُفتح بعد.':copy.title}</h1>
      <p>{closed?'يمكنك تصفّح الوصفات الآن والعودة للمشاركة لاحقًا.':copy.description}</p>
    </header>
    {!closed&&(stage==='signup'||verifying)&&<>
      <p className="journey-auth-free"><ShieldCheck size={15}/>حساب مجاني · بلا اشتراك أو رسوم</p>
    </>}
    {!closed&&destination!=='/account'&&<p className="journey-auth-return">نكمل من الصفحة التي اخترتها بعد الدخول.</p>}
    {oauthError?<Notice error>لم يكتمل تسجيل الدخول بالخدمة. حاول مجددًا أو استخدم بريدك الإلكتروني.</Notice>:confirmationError&&<Notice error>رابط التأكيد غير صالح أو انتهت مدته. اطلب رسالة جديدة.</Notice>}
    {closed?<div className="journey-auth-closed">
      <LockKeyhole size={30} strokeWidth={1.5}/>
      <p>الوصفات المنشورة متاحة للجميع.</p>
      <Link className="button full" href="/explore">استكشف الوصفات</Link>
      <Link className="journey-auth-text-link" href={authHref('login',destination)}>لديك حساب؟ تسجيل الدخول</Link>
    </div>:<>
      {showSocial&&providers.length>0&&<div className="journey-auth-social">
        <div className="journey-auth-provider-list">{providers.map(provider=><button key={provider} className="journey-auth-provider" type="button" disabled={action.busy||!!socialBusy} onClick={()=>void startSocial(provider)}>{provider==='google'&&<Image className="journey-auth-google-icon" src="/brand/google-g.png" alt="" width={200} height={204} unoptimized/>}<span className="journey-auth-provider-label">{socialBusy===provider?'جاري الانتقال…':<>المتابعة باستخدام <bdi>{provider==='google'?'Google':'Apple'}</bdi></>}</span></button>)}</div>
        {socialError&&<Notice error>{socialError}</Notice>}
        <p className="journey-auth-social-divider"><span>أو بالبريد الإلكتروني</span></p>
      </div>}
      {(stage==='signup'||verifying)&&<ol className="journey-auth-steps" aria-label="خطوات التسجيل بالبريد"><li aria-current={!verifying?'step':undefined}><span>1</span>بيانات الحساب</li><li aria-current={verifying?'step':undefined}><span>2</span>تأكيد البريد</li></ol>}
      <form className="journey-auth-form" onSubmit={async e=>{
        e.preventDefault();if(socialAttempt.current?.pending||action.busy)return;const form=new FormData(e.currentTarget);const payload:Record<string,string>=destination==='/account'?{}:{next:destination};
        if(isEmail)payload.email=email.trim();if(isPassword)payload.password=String(form.get('password'));if(verifying)payload.token=normalizeEmailCode(code)||code;else if(token)payload.captchaToken=token;
        const result=await action.run(()=>api<{message?:string;confirmation?:boolean}>('/api/auth/'+stage,'POST',payload));
        if(!verifying)resetCaptcha();
        if(result){if(stage==='login'||stage==='reset'||verifying){router.replace(destination);router.refresh();}else if(result.confirmation){setEmail(payload.email);setCode('');setStage('verify');setCooldown(60);setShowPassword(false);action.setMessage(result.message||'راجع بريدك لإدخال الرمز.');}else action.setMessage(result.message||'تم إرسال الطلب.');}
      }}>
        <fieldset disabled={action.busy||!!socialBusy}>
          {isEmail&&<Field label="البريد الإلكتروني"><input name="email" type="email" dir="ltr" autoComplete="email" required maxLength={254} placeholder="you@example.com" value={email} onChange={event=>{setEmail(event.target.value);if(verifying)setCode('');}}/></Field>}
          {isPassword&&<div className="field">
            <label htmlFor={passwordId}>كلمة المرور</label>
            <div className="journey-auth-password"><input id={passwordId} name="password" type={showPassword?'text':'password'} dir="ltr" autoComplete={stage==='login'?'current-password':'new-password'} required minLength={stage==='login'?1:12} maxLength={128}/><button type="button" aria-label={showPassword?'إخفاء كلمة المرور':'إظهار كلمة المرور'} aria-pressed={showPassword} aria-controls={passwordId} onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={19}/>:<Eye size={19}/>}</button></div>
            {stage!=='login'&&<small>12 حرفًا على الأقل. استخدم عبارة طويلة وفريدة.</small>}
          </div>}
          {stage==='login'&&<div className="journey-auth-forgot"><Link href={authHref('forgot',destination)}>نسيت كلمة المرور؟</Link></div>}
          {verifying&&<Field label="رمز تأكيد البريد" hint="الصق الرمز أو أدخله بالأرقام العربية أو الإنجليزية."><input className="journey-auth-code" name="code" type="text" inputMode="numeric" dir="ltr" autoComplete="one-time-code" required pattern="[0-9٠-٩۰-۹]{6}" maxLength={6} placeholder="000000" value={code} onChange={event=>setCode(event.target.value)}/></Field>}
          {captcha&&!verifying&&<Captcha key={captchaKey} onToken={setToken}/>}
          <button className="button full journey-auth-submit" disabled={!verifying&&captcha&&!token}>{action.busy?'جاري التحقق…':copy.button}</button>
        </fieldset>
      </form>
      {action.message&&<Notice error={action.failed}>{action.message}</Notice>}
      {verifying&&<div className="journey-auth-resend">
        <p><MailCheck size={17}/>لم يصل الرمز؟ راجع البريد غير المرغوب فيه وتأكد من عنوانك.</p>
        {captcha&&<Captcha key={captchaKey} onToken={setToken}/>}
        <button className="button secondary full" type="button" disabled={action.busy||cooldown>0||(captcha&&!token)||!email.trim()} onClick={async()=>{
          const result=await action.run(()=>api<{message:string}>('/api/auth/resend','POST',{email:email.trim(),...(token?{captchaToken:token}:{}),...(destination!=='/account'?{next:destination}:{})}));
          resetCaptcha();setCooldown(60);if(result){setCode('');action.setMessage(result.message);}
        }}>{cooldown>0?'إعادة الإرسال بعد '+cooldown+' ثانية':'أرسل رمزًا جديدًا'}</button>
      </div>}
      {stage==='login'&&<p className="journey-auth-confirm-link">لم تؤكّد بريدك؟ <Link href={authHref('verify',destination)}>تأكيد البريد</Link></p>}
      <footer className="journey-auth-switch">
        {stage==='login'?<><span>{signupEnabled?'ليس لديك حساب؟':'إنشاء الحسابات مغلق حاليًا.'}</span><Link href={signupEnabled?authHref('signup',destination):'/explore'}>{signupEnabled?'أنشئ حسابك مجانًا':'تصفّح الوصفات'}</Link></>:<>
          <span>لديك حساب؟</span><Link href={authHref('login',destination)}>تسجيل الدخول</Link>
          {stage==='resend'&&<Link href={authHref('verify',destination)}>لديك رمز؟ أدخله هنا</Link>}
        </>}
      </footer>
    </>}
    <p className="journey-auth-privacy"><ShieldCheck size={14}/>بريدك خاص ولا يظهر في ملفك العام.</p>
  </section>;
}
