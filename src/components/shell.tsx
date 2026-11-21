import Link from 'next/link';
import {Bookmark,Plus,UserRound,LogIn,ArrowUpLeft,ArrowRight,House,ShieldCheck,Search,UsersRound} from 'lucide-react';
import type {ReactNode} from 'react';
import type {Viewer} from '@/lib/types';
import {publicSignupEnabled} from '@/lib/env';
import {authHref} from '@/lib/auth-navigation';
import {AppNavLink} from './app-nav-link';

export function Brand({light=false}:{light?:boolean}) {
  return <span className="brand-lockup"><img src={light?'/brand/logo-yellow.svg':'/brand/logo.svg'} width={175} height={60} alt="Goat Journey"/><span className="brand-product" dir="ltr">COMMUNITY</span></span>;
}

function MobileNavigation({viewer,active,accountTab}:{viewer:Viewer|null;active:string;accountTab:string}) {
  const createHref=viewer?'/recipes/new':authHref('login','/recipes/new');
  const savedHref=viewer?'/account?tab=saved':authHref('login','/account?tab=saved');
  return <nav className="journey-bottom-nav" aria-label="التنقل على الهاتف">
    <AppNavLink href="/explore" active={active==='explore'}><House size={23}/><span>الرئيسية</span></AppNavLink>
    <AppNavLink href="/search" active={active==='search'||active==='people'}><Search size={23}/><span>البحث</span></AppNavLink>
    <AppNavLink href={createHref} active={active==='recipes/new'||active.endsWith('/edit')} className="journey-create-tab"><span className="journey-create-icon"><Plus size={25}/></span><span>إنشاء</span></AppNavLink>
    <AppNavLink href={savedHref} active={active==='account'&&accountTab==='saved'}><Bookmark size={23}/><span>المحفوظات</span></AppNavLink>
    <AppNavLink href={viewer?'/account':authHref('login')} active={(active==='account'&&accountTab!=='saved')||active.startsWith('members/')}><UserRound size={23}/><span>صفحتي</span></AppNavLink>
  </nav>;
}

export function Shell({children,viewer=null,landing=false,active='',accountTab='published',authNext}:{children:ReactNode;viewer?:Viewer|null;landing?:boolean;active?:string;accountTab?:string;authNext?:string}) {
  const signupEnabled=publicSignupEnabled();
  const authDestination=authNext??(active?'/'+active:undefined);
  const mobileNavigation=<MobileNavigation viewer={viewer} active={active} accountTab={accountTab}/>;
  if(active.startsWith('auth/'))return <div className="journey-auth-shell">
    <a className="skip-link" href="#content">انتقل إلى المحتوى</a>
    <header className="journey-auth-header"><Link href="/explore" aria-label="العودة إلى الوصفات" className="journey-back"><ArrowRight size={23}/></Link><Link href="/explore" className="brand" aria-label="Goat Journey"><Brand/></Link><span/></header>
    <main id="content" tabIndex={-1} className="journey-auth-main">{children}</main>
    <footer className="journey-auth-footer"><span>من أهل القهوة، لأهل القهوة.</span><Link href="/explore">تصفّح الوصفات</Link><Link href="/privacy">الخصوصية</Link></footer>
  </div>;
  if(!landing){
    const focused=active.startsWith('recipes/')||active.startsWith('learn/');
    const createHref=viewer?'/recipes/new':authHref('login','/recipes/new');
    return <div className={'community-app journey-app'+(focused?' journey-focus':'')}>
      <a className="skip-link" href="#content">انتقل إلى المحتوى</a>
      {!focused&&<header className="journey-header"><div className="journey-header-inner">
        <Link className="brand" href="/explore" aria-label="Goat Journey — الوصفات"><Brand/></Link>
        <nav className="journey-desktop-nav" aria-label="التنقل الرئيسي">
          <AppNavLink href="/explore" active={active==='explore'}>اكتشف</AppNavLink>
          <AppNavLink href="/search" active={active==='search'}>ابحث عن وصفة</AppNavLink>
          <AppNavLink href="/people" active={active==='people'}>أهل القهوة</AppNavLink>
          <AppNavLink href={viewer?'/account?tab=saved':authHref('login','/account?tab=saved')} active={active==='account'&&accountTab==='saved'}>المحفوظات</AppNavLink>
        </nav>
        <div className="journey-header-actions">
          {viewer?<><Link className="journey-profile-link" href="/account" aria-label="صفحتي"><UserRound size={22}/></Link><Link className="button small journey-header-create" href={createHref}><Plus size={18}/>إنشاء وصفة</Link></>:<><Link className="journey-login-link" href={authHref('login',authDestination)}>دخول</Link>{signupEnabled&&<Link className="button small" href={authHref('signup',authDestination)}>انضم مجانًا</Link>}</>}
        </div>
      </div></header>}
      <main id="content" tabIndex={-1} className="journey-content">{children}</main>
      {!focused&&<footer className="journey-footer"><Link href="/">عن جوت جيرني</Link><Link href="/people"><UsersRound size={15}/>أهل القهوة</Link><Link href="/privacy" aria-current={active==='privacy'?'page':undefined}>الخصوصية</Link>{viewer?.moderator&&<Link href="/moderation"><ShieldCheck size={15}/>المراجعة</Link>}<span dir="ltr">GOAT JOURNEY COMMUNITY</span></footer>}
      {!focused&&mobileNavigation}
    </div>;
  }
  return <>
    <a className="skip-link" href="#content">انتقل إلى المحتوى</a>
    <header className="site-header"><div className="header-inner">
      <Link className="brand" href="/" aria-label="Goat Journey — الصفحة الرئيسية"><Brand/></Link>
      <nav aria-label="التنقل الرئيسي">
        <Link href="/" aria-current={landing?'page':undefined}>الرئيسية</Link>
        <Link href="/explore" aria-current={active==='explore'?'page':undefined}>الوصفات</Link>
        <Link href="/#about">عن المجتمع</Link>
        {viewer?.moderator&&<Link href="/moderation">المراجعة</Link>}
      </nav>
      <div className="header-actions">
        <Link className="account-link" href={viewer?'/account':authHref('login',authDestination)} aria-current={active==='account'||active.startsWith('auth/')?'page':undefined}><UserRound size={18}/><span>{viewer?'حسابي':'دخول الأعضاء'}</span></Link>
        <Link className="button small" href={viewer?'/recipes/new':signupEnabled?authHref('signup',authDestination):'/explore'}>{viewer?'شارك وصفة':signupEnabled?'انضم مجانًا':'استكشف المجتمع'}<ArrowUpLeft size={18}/></Link>
      </div>
    </div></header>
    <main id="content" tabIndex={-1} className={landing?'landing-main':'container'}>{children}</main>
    <footer className="site-footer"><div className="footer-inner">
      <div className="footer-brand"><Link className="brand" href="/" aria-label="Goat Journey — الصفحة الرئيسية"><Brand light/></Link><p>من أهل القهوة، لأهل القهوة.<br/>مساحة تجمعنا، وتجارب تقرّبنا.</p></div>
      <div className="footer-links"><span className="footer-label">اكتشف المساحة</span><Link href="/explore">الوصفات<ArrowUpLeft size={16}/></Link><Link href="/#about">عن المجتمع</Link><Link href="/#questions">أسئلة شائعة</Link><Link href="/privacy">سياسة الخصوصية</Link></div>
      <div className="footer-note"><span className="footer-label" dir="ltr">GOOD COFFEE. SHARED KNOWLEDGE.</span><p>نبدأ من فلسطين،<br/>ونكبر بتجاربكم.</p><Link href={viewer?'/account':authHref('login',authDestination)}>{viewer?'انتقل إلى حسابك':'دخول الأعضاء'}<ArrowUpLeft size={18}/></Link></div>
      <div className="footer-bottom"><span dir="ltr">© {new Date().getFullYear()} Goat Journey Community</span><span>{signupEnabled?'التصفّح والتسجيل مجانًا · بلا اشتراك أو رسوم':'التصفّح متاح للجميع · التسجيل مغلق حاليًا'}</span></div>
    </div></footer>
    {mobileNavigation}
  </>;
}
