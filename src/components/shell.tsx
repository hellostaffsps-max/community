import Link from 'next/link';
import {Compass,Bookmark,Plus,UserRound,ArrowUpLeft,House} from 'lucide-react';
import type {ReactNode} from 'react';
import type {Viewer} from '@/lib/types';
export function Brand({light=false}:{light?:boolean}) {
  return <span className="brand-lockup"><img src={light?'/brand/logo-yellow.svg':'/brand/logo.svg'} width={175} height={60} alt="Goat Journey"/><span className="brand-product" dir="ltr">COMMUNITY</span></span>;
}

export function Shell({children,viewer=null,landing=false,active=''}:{children:ReactNode;viewer?:Viewer|null;landing?:boolean;active?:string}) {
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
        <Link className="button small" href={viewer?'/recipes/new':'/explore'}>{viewer?'شارك وصفة':'استكشف المجتمع'}<ArrowUpLeft size={18}/></Link>
      </div>
    </div></header>
    <main id="content" className={landing?'landing-main':'container'}>{children}</main>
    <footer className="site-footer"><div className="footer-inner">
      <div className="footer-brand"><Link className="brand" href="/" aria-label="Goat Journey — الصفحة الرئيسية"><Brand light/></Link><p>من أهل القهوة، لأهل القهوة.<br/>مساحة تجمعنا، وتجارب تقرّبنا.</p></div>
      <div className="footer-links"><span className="footer-label">اكتشف المساحة</span><Link href="/explore">وصفات المجتمع<ArrowUpLeft size={16}/></Link><Link href="/#about">عن المجتمع</Link><Link href="/#questions">أسئلة شائعة</Link></div>
      <div className="footer-note"><span className="footer-label" dir="ltr">GOOD COFFEE. SHARED KNOWLEDGE.</span><p>نبدأ من فلسطين،<br/>ونكبر بتجاربكم.</p><Link href={viewer?'/account':'/auth/login'}>{viewer?'انتقل إلى حسابك':'دخول الأعضاء'}<ArrowUpLeft size={18}/></Link></div>
      <div className="footer-bottom"><span dir="ltr">© {new Date().getFullYear()} Goat Journey Community</span><span>التصفّح متاح للجميع · التسجيل مغلق حاليًا</span></div>
    </div></footer>
    <nav className="mobile-nav" aria-label="التنقل على الهاتف">
      <Link href="/" aria-current={landing?'page':undefined}><House size={20}/>الرئيسية</Link>
      <Link href="/explore" aria-current={active==='explore'?'page':undefined}><Compass size={20}/>الوصفات</Link>
      <Link href={viewer?'/recipes/new':'/account?tab=saved'}>{viewer?<Plus size={21}/>:<Bookmark size={20}/>}<span>{viewer?'شارك وصفة':'محفوظاتي'}</span></Link>
      <Link href={viewer?'/account':'/auth/login'} aria-current={active==='account'||active.startsWith('auth/')?'page':undefined}><UserRound size={20}/>{viewer?'حسابي':'دخول'}</Link>
    </nav>
  </>;
}
