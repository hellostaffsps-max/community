import Link from 'next/link';
import type {ReactNode} from 'react';
import {ArrowUpLeft,BookOpen,Bookmark,Compass,FilePenLine,MapPin,Plus,Settings2,ShieldCheck,UserRound} from 'lucide-react';
import type {Profile,Recipe} from '@/lib/types';
import {accountNeedsSetup,hasDefaultDisplayName,hasGeneratedUsername} from '@/lib/member-onboarding';
import {Avatar,Cards} from './shared';
import {ProfileForm,SignOut} from './account';

const sections=[{key:'published',label:'وصفاتي',icon:BookOpen},{key:'drafts',label:'المسودات',icon:FilePenLine},{key:'saved',label:'المحفوظات',icon:Bookmark},{key:'profile',label:'الإعدادات',icon:Settings2}];
const copy:Record<string,{title:string;description:string;emptyTitle:string;emptyText:string}>={
  published:{title:'وصفاتي',description:'الوصفات التي شاركتها مع المجتمع.',emptyTitle:'وصفتك الأولى تبدأ هنا.',emptyText:'شارك المقادير والخطوات، وكل تفصيل جعل الفنجان مختلفًا.'},
  drafts:{title:'المسودات',description:'تجاربك قيد التحضير.',emptyTitle:'مساحة للتجربة.',emptyText:'احفظ وصفتك كمسودة، وارجع إليها عندما تصبح جاهزة.'},
  saved:{title:'المحفوظات',description:'وصفات تريد العودة إليها.',emptyTitle:'احفظ ما يلهمك.',emptyText:'تصفّح الوصفات واحفظ ما ترغب في تجربته لتجده هنا.'},
};

export function AccountPage({profile,recipes,tab,pagination}:{profile:Profile;recipes:Recipe[];tab:string;pagination?:ReactNode}){
  const content=copy[tab]||copy.published;const selected=sections.find(section=>section.key===tab)||sections[0];const Icon=selected.icon;
  const needsSetup=accountNeedsSetup(profile);const generatedUsername=hasGeneratedUsername(profile.username);
  return <div className={'journey-profile journey-account journey-account-'+tab}>
    {tab==='profile'?<header className="journey-account-settings-header"><h1>إعدادات الحساب</h1></header>:<header className="journey-profile-header">
      <div className="journey-profile-avatar"><Avatar profile={profile}/></div>
      <h1>{hasDefaultDisplayName(profile.display_name)?'أهلًا بك بين أهل القهوة.':profile.display_name}</h1>
      {!generatedUsername&&<p className="journey-profile-handle" dir="ltr">@{profile.username}</p>}
      {profile.bio&&<p className="journey-profile-bio preserve">{profile.bio}</p>}
      {profile.city&&<p className="journey-profile-location"><MapPin size={14}/>{profile.city}</p>}
      {needsSetup&&<p className="journey-profile-setup">اختر اسمك ليعرف المجتمع صاحب الوصفة.</p>}
      <div className="journey-profile-actions">
        <Link className="button secondary small" href="/account?tab=profile"><Settings2 size={16}/>{needsSetup?'أكمل ملفك':'تعديل الملف'}</Link>
        <Link className="button small" href="/recipes/new"><Plus size={17}/>وصفة جديدة</Link>
        {!generatedUsername&&<Link className="journey-profile-public-link" href={'/members/'+profile.username}>ملفي العام<ArrowUpLeft size={15}/></Link>}
      </div>
    </header>}

    {needsSetup&&tab==='published'&&<section className="journey-welcome" aria-labelledby="journey-welcome-title">
      <div className="journey-welcome-heading"><h2 id="journey-welcome-title">ابدأ من هنا</h2><p>خطوات صغيرة لمساحة تشبهك.</p></div>
      <ol>
        <li><UserRound size={20}/><div><strong>عرّفنا باسمك</strong><span>الصورة والنبذة اختياريتان.</span></div><Link href="/account?tab=profile" aria-label="أكمل اسمك وملفك">أكمل ملفك<ArrowUpLeft size={16}/></Link></li>
        <li><Compass size={20}/><div><strong>خذ فكرة لفنجانك</strong><span>اكتشف وصفات أهل القهوة.</span></div><Link href="/explore">استكشف<ArrowUpLeft size={16}/></Link></li>
        <li><FilePenLine size={20}/><div><strong>دوّن أول تجربة</strong><span>يمكنك حفظها كمسودة خاصة.</span></div><Link href="/recipes/new">ابدأ وصفة<ArrowUpLeft size={16}/></Link></li>
      </ol>
    </section>}

    <nav className="journey-profile-tabs" aria-label="أقسام الحساب">
      {sections.map(({key,label,icon:SectionIcon})=><Link href={'/account?tab='+key} key={key} aria-current={tab===key?'page':undefined}><SectionIcon size={18}/><span>{label}</span></Link>)}
    </nav>
    <div className="journey-profile-content">
      {tab==='profile'?<ProfileForm profile={profile}/>:<>
        <div className="journey-profile-section-title"><div><h2>{content.title}</h2><p>{content.description}</p></div></div>
        {tab!=='published'&&<p className="journey-profile-private"><ShieldCheck size={14}/>{tab==='saved'?'المحفوظات خاصة بك. لا تظهر الوصفات المحذوفة أو المخفية.':'هذه المسودات وصورها لا يراها أحد غيرك.'}</p>}
        {recipes.length?<Cards recipes={recipes}/>:<section className="journey-profile-empty"><Icon size={34} strokeWidth={1.4}/><h3>{content.emptyTitle}</h3><p>{content.emptyText}</p><Link className="button small" href={tab==='saved'?'/explore':'/recipes/new'}>{tab==='saved'?'استكشف الوصفات':'ابدأ وصفة'}<ArrowUpLeft size={17}/></Link></section>}
        {pagination}
      </>}
    </div>
    <div className="journey-account-session"><SignOut/></div>
  </div>;
}
