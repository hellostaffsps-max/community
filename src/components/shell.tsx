import Link from 'next/link';
import {Compass,Bookmark,Plus,UserRound,ArrowUpLeft,House,BookOpen,FilePenLine,Settings2,ChevronLeft,ShieldCheck,Search} from 'lucide-react';
import type {ReactNode} from 'react';
import type {Viewer} from '@/lib/types';
import {publicSignupEnabled} from '@/lib/env';
import {AppNavLink} from './app-nav-link';
export function Brand({light=false}:{light?:boolean}) {
  return <span className="brand-lockup"><img src={light?'/brand/logo-yellow.svg':'/brand/logo.svg'} width={175} height={60} alt="Goat Journey"/><span className="brand-product" dir="ltr">COMMUNITY</span></span>;
}

export function Shell({children,viewer=null,landing=false,active='',accountTab='published'}:{children:ReactNode;viewer?:Viewer|null;landing?:boolean;active?:string;accountTab?:string}) {
  const signupEnabled=publicSignupEnabled();
  if(!landing&&active&&!active.startsWith('auth/')){
    const editing=active==='recipes/new'||active.endsWith('/edit');
    const title=active==='explore'?'استكشف المجتمع':editing?'استوديو الوصفات':active==='account'?'دفتر تجاربك':active==='moderation'?'مراجعة المجتمع':active.startsWith('members/')?'من أهل القهوة':'حكاية فنجان';
    const sections=[{href:'/explore',label:'اكتشف الوصفات',icon:Compass,selected:active==='explore'},{href:'/account',label:'وصفاتي',icon:BookOpen,selected:active==='account'&&accountTab==='published'},{href:'/account?tab=saved',label:'المحفوظات',icon:Bookmark,selected:active==='account'&&accountTab==='saved'},{href:'/account?tab=drafts',label:'المسودات',icon:FilePenLine,selected:active==='account'&&accountTab==='drafts'}];
    return <div className="community-app"><a className="skip-link" href="#content">انتقل إلى المحتوى</a><aside className="app-sidebar"><Link className="brand" href="/" aria-label="Goat Journey — الصفحة الرئيسية"><Brand/></Link><span className="app-sidebar-label">مساحة أهل القهوة</span><nav aria-label="التنقل الرئيسي">{sections.map(({href,label,icon:Icon,selected})=><AppNavLink key={href} href={href} active={selected}><Icon size={21}/><span>{label}</span><ChevronLeft className="nav-chevron" size={15}/></AppNavLink>)}<AppNavLink href={viewer?'/recipes/new':'/auth/login'} active={editing} className="app-create-link"><Plus size={21}/><span>وصفة جديدة</span></AppNavLink></nav><div className="app-sidebar-note"><img src="/brand/mark.svg" width={38} height={38} alt=""/><strong>كل فنجان يكمّل الحكاية.</strong><p>جرّب، دوّن، وشارك ما تعلّمته.</p><span dir="ltr">BREW. SHARE. REPEAT.</span></div><nav className="app-secondary-nav" aria-label="الحساب والمجتمع"><AppNavLink href={viewer?'/account?tab=profile':'/auth/login'} active={active==='account'&&accountTab==='profile'}><Settings2 size={19}/><span>{viewer?'إعدادات حسابي':'تسجيل الدخول'}</span></AppNavLink>{viewer?.moderator&&<AppNavLink href="/moderation" active={active==='moderation'}><ShieldCheck size={19}/><span>المراجعة</span></AppNavLink>}<AppNavLink href="/"><House size={19}/><span>عن جوت جيرني</span></AppNavLink></nav></aside>
      <div className="app-stage"><header className="app-topbar"><div className="app-location"><span dir="ltr">COMMUNITY</span><ChevronLeft size={15}/><strong>{title}</strong></div><Link className="app-mobile-brand" href="/" aria-label="Goat Journey — الصفحة الرئيسية"><img src="/brand/logo.svg" width={105} height={36} alt="Goat Journey"/></Link><div className="app-topbar-actions"><Link href="/explore" aria-label="ابحث في الوصفات" className="app-search-link"><Search size={20}/></Link><span className="app-free-badge">مجتمع مجاني</span><Link className="app-user-link" href={viewer?'/account?tab=profile':'/auth/login'} aria-label={viewer?'إعدادات حسابي':'تسجيل الدخول'}><UserRound size={19}/></Link></div></header><main id="content" className="app-content">{children}</main><footer className="app-footer"><span dir="ltr">GOAT JOURNEY COMMUNITY</span><span>من أهل القهوة، لأهل القهوة.</span></footer></div>
      <nav className="app-bottom-nav" aria-label="التنقل على الهاتف"><AppNavLink href="/explore" active={active==='explore'}><Compass size={21}/><span>اكتشف</span></AppNavLink><AppNavLink href="/account?tab=saved" active={active==='account'&&accountTab==='saved'}><Bookmark size={21}/><span>محفوظاتي</span></AppNavLink><AppNavLink href={viewer?'/recipes/new':'/auth/login'} active={editing} className="mobile-create"><span className="mobile-create-icon"><Plus size={22}/></span><span>وصفة جديدة</span></AppNavLink><AppNavLink href="/account?tab=drafts" active={active==='account'&&accountTab==='drafts'}><FilePenLine size={21}/><span>مسوداتي</span></AppNavLink><AppNavLink href={viewer?'/account':'/auth/login'} active={active==='account'&&['published','profile'].includes(accountTab)}><UserRound size={21}/><span>{viewer?'حسابي':'دخول'}</span></AppNavLink></nav>
    </div>;
  }
  return <>
    <a className="skip-link" href="#content">انتقل إلى المحتوى</a>
    <header className="site-header"><div className="header-inner">
      <Link className="brand" href="/" aria-label="Goat Journey — الصفحة الرئيسية"><Brand/></Link>
      <nav aria-label="التنقل الرئيسي">
        <Link href="/" aria-current={landing?'page':undefined}>الرئيسية</Link>
        <Link href="/explore" aria-current={active==='explore'?'page':undefined}>وصفات المجتمع</Link>
        <Link href="/#about">عن المجتمع</Link>
        {viewer?.moderator&&<Link href="/moderation">المراجعة</Link>}
      </nav>
      <div className="header-actions">
        <Link className="account-link" href={viewer?'/account':'/auth/login'} aria-current={active==='account'||active.startsWith('auth/')?'page':undefined}><UserRound size={18}/><span>{viewer?'حسابي':'دخول الأعضاء'}</span></Link>
        <Link className="button small" href={viewer?'/recipes/new':signupEnabled?'/auth/signup':'/explore'}>{viewer?'شارك وصفة':signupEnabled?'انضم مجانًا':'استكشف المجتمع'}<ArrowUpLeft size={18}/></Link>
      </div>
    </div></header>
    <main id="content" className={landing?'landing-main':'container'}>{children}</main>
    <footer className="site-footer"><div className="footer-inner">
      <div className="footer-brand"><Link className="brand" href="/" aria-label="Goat Journey — الصفحة الرئيسية"><Brand light/></Link><p>من أهل القهوة، لأهل القهوة.<br/>مساحة تجمعنا، وتجارب تقرّبنا.</p></div>
      <div className="footer-links"><span className="footer-label">اكتشف المساحة</span><Link href="/explore">وصفات المجتمع<ArrowUpLeft size={16}/></Link><Link href="/#about">عن المجتمع</Link><Link href="/#questions">أسئلة شائعة</Link></div>
      <div className="footer-note"><span className="footer-label" dir="ltr">GOOD COFFEE. SHARED KNOWLEDGE.</span><p>نبدأ من فلسطين،<br/>ونكبر بتجاربكم.</p><Link href={viewer?'/account':'/auth/login'}>{viewer?'انتقل إلى حسابك':'دخول الأعضاء'}<ArrowUpLeft size={18}/></Link></div>
      <div className="footer-bottom"><span dir="ltr">© {new Date().getFullYear()} Goat Journey Community</span><span>{signupEnabled?'التصفّح والتسجيل مجانًا · بلا اشتراك أو رسوم':'التصفّح متاح للجميع · التسجيل مغلق حاليًا'}</span></div>
    </div></footer>
    <nav className="mobile-nav" aria-label="التنقل على الهاتف">
      <Link href="/" aria-current={landing?'page':undefined}><House size={20}/>الرئيسية</Link>
      <Link href="/explore" aria-current={active==='explore'?'page':undefined}><Compass size={20}/>الوصفات</Link>
      <Link href={viewer?'/recipes/new':'/account?tab=saved'}>{viewer?<Plus size={21}/>:<Bookmark size={20}/>}<span>{viewer?'شارك وصفة':'محفوظاتي'}</span></Link>
      <Link href={viewer?'/account':'/auth/login'} aria-current={active==='account'||active.startsWith('auth/')?'page':undefined}><UserRound size={20}/>{viewer?'حسابي':'دخول'}</Link>
    </nav>
  </>;
}
