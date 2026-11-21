import Link from 'next/link';
import {Bookmark,House,Plus,Search,UserRound} from 'lucide-react';
import {Brand} from '@/components/shell';
import {AppNavLink} from '@/components/app-nav-link';
import styles from './loading.module.css';

export default function Loading(){
  return <div className="community-app journey-app">
    <a className="skip-link" href="#loading-content">انتقل إلى المحتوى</a>
    <header className="journey-header"><div className="journey-header-inner">
      <Link className="brand" href="/explore" aria-label="Goat Journey — الوصفات"><Brand/></Link>
      <nav className="journey-desktop-nav" aria-label="التنقل الرئيسي">
        <AppNavLink href="/explore">اكتشف</AppNavLink>
        <AppNavLink href="/search">ابحث عن وصفة</AppNavLink>
        <AppNavLink href="/people">أهل القهوة</AppNavLink>
        <AppNavLink href="/account?tab=saved">المحفوظات</AppNavLink>
      </nav>
      <div className="journey-header-actions"><Link className="journey-profile-link" href="/account" aria-label="صفحتي"><UserRound size={20}/></Link></div>
    </div></header>
    <main id="loading-content" tabIndex={-1} className={`journey-content ${styles.content}`}>
      <p className={styles.status} role="status"><span aria-hidden="true"/>نحضّر الصفحة…</p>
      <div className={styles.skeleton} aria-hidden="true">
        <div className={styles.heading}><span/><span/></div>
        <div className={styles.search}/>
        <div className={styles.tabs}><span/><span/><span/></div>
        <div className={styles.cards}>{[0,1,2].map(index=><div className={styles.card} key={index}><div className={styles.cover}/><div className={styles.copy}><span/><span/><span/></div></div>)}</div>
      </div>
    </main>
    <footer className="journey-footer"><Link href="/explore">الوصفات</Link><Link href="/privacy">الخصوصية</Link><span dir="ltr">GOAT JOURNEY COMMUNITY</span></footer>
    <nav className="journey-bottom-nav" aria-label="التنقل على الهاتف">
      <AppNavLink href="/explore"><House size={23}/><span>الرئيسية</span></AppNavLink>
      <AppNavLink href="/search"><Search size={23}/><span>البحث</span></AppNavLink>
      <AppNavLink href="/recipes/new" className="journey-create-tab"><span className="journey-create-icon"><Plus size={25}/></span><span>إنشاء</span></AppNavLink>
      <AppNavLink href="/account?tab=saved"><Bookmark size={23}/><span>المحفوظات</span></AppNavLink>
      <AppNavLink href="/account"><UserRound size={23}/><span>صفحتي</span></AppNavLink>
    </nav>
  </div>;
}
