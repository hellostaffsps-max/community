import Link from 'next/link';
import {Compass,Bookmark,Plus,UserRound,UserPlus,LogIn,ArrowUpLeft,House,BookOpen,FilePenLine,Settings2,ChevronLeft,ShieldCheck,Search,UsersRound} from 'lucide-react';
import type {ReactNode} from 'react';
import type {Viewer} from '@/lib/types';
import {publicSignupEnabled} from '@/lib/env';
import {authHref} from '@/lib/auth-navigation';
import {AppNavLink} from './app-nav-link';

export function Brand({light=false}:{light?:boolean}) {
  return <span className="brand-lockup"><img src={light?'/brand/logo-yellow.svg':'/brand/logo.svg'} width={175} height={60} alt="Goat Journey"/><span className="brand-product" dir="ltr">COMMUNITY</span></span>;
}

function MobileNavigation({viewer,signupEnabled,active,landing,accountTab,authNext}:{viewer:Viewer|null;signupEnabled:boolean;active:string;landing:boolean;accountTab:string;authNext?:string}) {
  const exploring=active==='explore'||active.startsWith('learn/');
  const editing=active==='recipes/new'||active.endsWith('/edit');
  return <nav className={'app-bottom-nav '+(viewer?'member-bottom-nav':'visitor-bottom-nav')} aria-label="التنقل على الهاتف">
    {viewer?<>
      <AppNavLink href="/explore" active={exploring}><Compass size={21}/><span>اكتشف</span></AppNavLink>
      <AppNavLink href="/account?tab=saved" active={active==='account'&&accountTab==='saved'}><Bookmark size={21}/><span>محفوظاتي</span></AppNavLink>
      <AppNavLink href="/recipes/new" active={editing} className="mobile-create"><span className="mobile-create-icon"><Plus size={22}/></span><span>وصفة جديدة</span></AppNavLink>
      <AppNavLink href="/people" active={active==='people'||active.startsWith('members/')}><UsersRound size={21}/><span>أهل القهوة</span></AppNavLink>
      <AppNavLink href="/account" active={active==='account'&&['published','profile'].includes(accountTab)}><UserRound size={21}/><span>حسابي</span></AppNavLink>
    </>:<>
      <AppNavLink href="/" active={landing}><House size={21}/><span>الرئيسية</span></AppNavLink>
      <AppNavLink href="/explore" active={exploring}><Compass size={21}/><span>الوصفات</span></AppNavLink>
      <AppNavLink href="/people" active={active==='people'||active.startsWith('members/')}><UsersRound size={21}/><span>أهل القهوة</span></AppNavLink>
      {signupEnabled&&<AppNavLink href={authHref('signup',authNext)} active={active==='auth/signup'||active==='auth/verify'} className="mobile-join"><UserPlus size={21}/><span>انضم مجانًا</span></AppNavLink>}
      <AppNavLink href={authHref('login',authNext)} active={['auth/login','auth/forgot','auth/reset'].includes(active)}><LogIn size={21}/><span>دخول</span></AppNavLink>
    </>}
  </nav>;
}

export function Shell({children,viewer=null,landing=false,active='',accountTab='published',authNext}:{children:ReactNode;viewer?:Viewer|null;landing?:boolean;active?:string;accountTab?:string;authNext?:string}) {
  const signupEnabled=publicSignupEnabled();
  const authDestination=active.startsWith('auth/')?authNext:active?'/'+active:undefined;
  const joinRecipeHref=authHref(signupEnabled?'signup':'login','/recipes/new');
  const mobileNavigation=<MobileNavigation viewer={viewer} signupEnabled={signupEnabled} active={active} landing={landing} accountTab={accountTab} authNext={authDestination}/>;
  if(!landing&&active&&!active.startsWith('auth/')){
    const editing=active==='recipes/new'||active.endsWith('/edit');
    const exploring=active==='explore'||active.startsWith('learn/');
    const title=active==='explore'?'دفاتر المجتمع':active==='people'?'أهل القهوة':active.startsWith('learn/')?'دليل التحضير':editing?'استوديو الوصفات':active==='account'?'دفتر تجاربك':active==='moderation'?'مراجعة المجتمع':active.startsWith('members/')?'من أهل القهوة':'حكاية فنجان';
    const sections=viewer?[
      {href:'/explore',label:'دفاتر المجتمع',icon:Compass,selected:exploring},
      {href:'/people',label:'أهل القهوة',icon:UsersRound,selected:active==='people'||active.startsWith('members/')},
      {href:'/account',label:'وصفاتي',icon:BookOpen,selected:active==='account'&&accountTab==='published'},
      {href:'/account?tab=saved',label:'المحفوظات',icon:Bookmark,selected:active==='account'&&accountTab==='saved'},
      {href:'/account?tab=drafts',label:'المسودات',icon:FilePenLine,selected:active==='account'&&accountTab==='drafts'},
    ]:[
      {href:'/explore',label:'دفاتر المجتمع',icon:Compass,selected:exploring},
      {href:'/people',label:'أهل القهوة',icon:UsersRound,selected:active==='people'||active.startsWith('members/')},
      {href:'/',label:'عن جوت جيرني',icon:House,selected:false},
    ];
    return <div className="community-app">
      <a className="skip-link" href="#content">انتقل إلى المحتوى</a>
      <aside className="app-sidebar">
        <Link className="brand" href="/" aria-label="Goat Journey — الصفحة الرئيسية"><Brand/></Link>
        <span className="app-sidebar-label">مساحة أهل القهوة</span>
        <nav aria-label="التنقل الرئيسي">
          {sections.map(({href,label,icon:Icon,selected})=><AppNavLink key={href} href={href} active={selected}><Icon size={21}/><span>{label}</span><ChevronLeft className="nav-chevron" size={15}/></AppNavLink>)}
          <AppNavLink href={viewer?'/recipes/new':joinRecipeHref} active={editing} className="app-create-link">{viewer?<Plus size={21}/>:<UserPlus size={21}/>}<span>{viewer?'وصفة جديدة':signupEnabled?'ابدأ دفترك مجانًا':'دخول الأعضاء'}</span></AppNavLink>
        </nav>
        <div className="app-sidebar-note"><img src="/brand/mark.svg" width={38} height={38} alt=""/><strong>كل فنجان يكمّل الحكاية.</strong><p>{viewer?'جرّب، دوّن، وشارك ما تعلّمته.':'تصفّح الوصفات الآن، وأنشئ حسابًا عندما ترغب في تدوين تجربتك.'}</p><span dir="ltr">BREW. SHARE. REPEAT.</span></div>
        <nav className="app-secondary-nav" aria-label="الحساب والمجتمع">
          <AppNavLink href={viewer?'/account?tab=profile':authHref('login',authDestination)} active={active==='account'&&accountTab==='profile'}>{viewer?<Settings2 size={19}/>:<LogIn size={19}/>}<span>{viewer?'إعدادات حسابي':'تسجيل الدخول'}</span></AppNavLink>
          {viewer?.moderator&&<AppNavLink href="/moderation" active={active==='moderation'}><ShieldCheck size={19}/><span>المراجعة</span></AppNavLink>}
          {viewer&&<AppNavLink href="/"><House size={19}/><span>عن جوت جيرني</span></AppNavLink>}
        </nav>
      </aside>
      <div className="app-stage">
        <header className="app-topbar"><div className="app-location"><span dir="ltr">COMMUNITY</span><ChevronLeft size={15}/><strong>{title}</strong></div><Link className="app-mobile-brand" href="/" aria-label="Goat Journey — الصفحة الرئيسية"><img src="/brand/logo.svg" width={105} height={36} alt="Goat Journey"/></Link><div className="app-topbar-actions"><Link href="/explore#recipe-search" aria-label="ابحث في الوصفات" className="app-search-link"><Search size={20}/></Link><span className="app-free-badge">مجتمع مجاني</span><Link className="app-user-link" href={viewer?'/account?tab=profile':authHref('login',authDestination)} aria-label={viewer?'إعدادات حسابي':'تسجيل الدخول'}><UserRound size={19}/></Link></div></header>
        <main id="content" className="app-content">{children}</main>
        <footer className="app-footer"><span dir="ltr">GOAT JOURNEY COMMUNITY</span><span>من أهل القهوة، لأهل القهوة.</span></footer>
      </div>
      {mobileNavigation}
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
    <main id="content" className={landing?'landing-main':'container'}>{children}</main>
    <footer className="site-footer"><div className="footer-inner">
      <div className="footer-brand"><Link className="brand" href="/" aria-label="Goat Journey — الصفحة الرئيسية"><Brand light/></Link><p>من أهل القهوة، لأهل القهوة.<br/>مساحة تجمعنا، وتجارب تقرّبنا.</p></div>
      <div className="footer-links"><span className="footer-label">اكتشف المساحة</span><Link href="/explore">الوصفات<ArrowUpLeft size={16}/></Link><Link href="/#about">عن المجتمع</Link><Link href="/#questions">أسئلة شائعة</Link></div>
      <div className="footer-note"><span className="footer-label" dir="ltr">GOOD COFFEE. SHARED KNOWLEDGE.</span><p>نبدأ من فلسطين،<br/>ونكبر بتجاربكم.</p><Link href={viewer?'/account':authHref('login',authDestination)}>{viewer?'انتقل إلى حسابك':'دخول الأعضاء'}<ArrowUpLeft size={18}/></Link></div>
      <div className="footer-bottom"><span dir="ltr">© {new Date().getFullYear()} Goat Journey Community</span><span>{signupEnabled?'التصفّح والتسجيل مجانًا · بلا اشتراك أو رسوم':'التصفّح متاح للجميع · التسجيل مغلق حاليًا'}</span></div>
    </div></footer>
    {mobileNavigation}
  </>;
}
