import Link from 'next/link';
import type {ReactNode} from 'react';
import {ArrowUpLeft,BookOpen,Bookmark,Compass,FilePenLine,MapPin,Plus,Settings2,ShieldCheck,UserRound} from 'lucide-react';
import type {Profile,Recipe} from '@/lib/types';
import {accountNeedsSetup,hasDefaultDisplayName,hasGeneratedUsername} from '@/lib/member-onboarding';
import {Avatar,Cards} from './shared';
import {ProfileForm,SignOut} from './account';

const sections=[{key:'published',label:'وصفاتي',icon:BookOpen},{key:'drafts',label:'المسودات',icon:FilePenLine},{key:'saved',label:'المحفوظات',icon:Bookmark},{key:'profile',label:'تعديل الملف',icon:Settings2}];
const copy:Record<string,{title:string;description:string;emptyTitle:string;emptyText:string}>={
  published:{title:'تجارب شاركتها.',description:'وصفاتك المنشورة، من دفترك إلى مجتمع القهوة.',emptyTitle:'لكل وصفة بداية.',emptyText:'شارك تجربتك الأولى: المقادير، الخطوات، والتفاصيل التي صنعت الفرق.'},
  drafts:{title:'على مهل، حتى تضبط.',description:'مسوداتك مساحة خاصة للتجربة، لا يراها أحد غيرك.',emptyTitle:'دفترك جاهز للفكرة القادمة.',emptyText:'ابدأ وصفة واحفظها كمسودة. ارجع إليها عندما تصبح جاهزة للمشاركة.'},
  saved:{title:'للفنجان القادم.',description:'مجموعة خاصة من الوصفات التي ألهمتك وأردت العودة إليها.',emptyTitle:'احتفظ بما يلهمك.',emptyText:'تصفّح المجتمع، واضغط «احفظ الوصفة» لتجد تجاربك المفضّلة هنا.'},
};

export function AccountPage({profile,recipes,tab,pagination}:{profile:Profile;recipes:Recipe[];tab:string;pagination?:ReactNode}){
  const content=copy[tab]||copy.published;const selected=sections.find(s=>s.key===tab)||sections[0];const Icon=selected.icon;
  const needsSetup=accountNeedsSetup(profile);const generatedUsername=hasGeneratedUsername(profile.username);
  return <div className="member-workspace">
    <section className="account-identity"><div className="identity-person"><Avatar profile={profile}/><div><span className="overline">مساحتك في Goat Journey</span><h1>{hasDefaultDisplayName(profile.display_name)?'أهلًا بك بين أهل القهوة.':profile.display_name}</h1><div className="identity-meta">{generatedUsername?<span>دفتر تجاربك يبدأ من هنا</span>:<span dir="ltr">@{profile.username}</span>}{profile.city&&<span><MapPin size={14}/>{profile.city}</span>}</div></div></div><Link className="button" href={needsSetup?'/account?tab=profile':'/recipes/new'}>{needsSetup?<><UserRound size={19}/>عرّفنا باسمك</>:<><Plus size={19}/>وصفة جديدة</>}</Link></section>
    {needsSetup&&tab==='published'&&<section className="member-welcome" aria-labelledby="member-welcome-title">
      <div className="member-welcome-heading"><span className="overline">بداية رحلتك</span><h2 id="member-welcome-title">خلّي المساحة تشبهك.</h2><p>اختر اسمك، خذ فكرة لفنجانك القادم، ودوّن أول تجربة على راحتك.</p></div>
      <ol className="member-first-steps">
        <li><span className="member-step-icon"><UserRound size={22}/></span><div><span className="member-step-number">01 / اسمك في المجتمع</span><h3>الشخص وراء الفنجان</h3><p>اختر اسم العرض واسم المستخدم. الصورة والنبذة اختياريتان.</p><Link className="button small" href="/account?tab=profile">أكمل ملفك<ArrowUpLeft size={16}/></Link></div></li>
        <li><span className="member-step-icon"><Compass size={22}/></span><div><span className="member-step-number">02 / فكرة للتجربة</span><h3>ابدأ بما تحب تحضيره</h3><p>تصفّح طرق التحضير، واختر وصفة تبدأ منها.</p><Link className="quiet-link" href="/explore">استكشف الوصفات<ArrowUpLeft size={16}/></Link></div></li>
        <li><span className="member-step-icon"><FilePenLine size={22}/></span><div><span className="member-step-number">03 / أول صفحة في دفترك</span><h3>جرّب، ثم شارك بطريقتك</h3><p>ابدأ وصفة أو احتفظ بها كمسودة خاصة حتى تكون جاهزة.</p><Link className="quiet-link" href="/recipes/new">ابدأ تجربتك<ArrowUpLeft size={16}/></Link></div></li>
      </ol>
    </section>}
    <div className="account-layout">
      <aside className="account-sidebar"><span className="sidebar-label">دفتر تجاربك</span><nav aria-label="أقسام الحساب">{sections.map(({key,label,icon:SectionIcon})=><Link href={`/account?tab=${key}`} key={key} aria-current={tab===key?'page':undefined}><SectionIcon size={20}/><span>{label}</span><ArrowUpLeft size={15} className="sidebar-arrow"/></Link>)}</nav><div className="account-sidebar-bottom">{!generatedUsername&&<Link href={`/members/${profile.username}`} className="quiet-link">ملفي العام<ArrowUpLeft size={16}/></Link>}<SignOut/></div></aside>
      <div className="account-content">
        {tab==='profile'?<ProfileForm profile={profile}/>:<>
          <div className="account-content-heading"><span className="section-icon"><Icon size={22}/></span><div><h2>{content.title}</h2><p>{content.description}</p></div></div>
          {tab!=='published'&&<div className="privacy-caption"><ShieldCheck size={16}/>{tab==='saved'?'المحفوظات خاصة بك. لا تظهر الوصفات المحذوفة أو المخفية.':'المسودات وصورها خاصة بك حتى تختار نشرها.'}</div>}
          {recipes.length?<Cards recipes={recipes}/>:<section className="account-empty"><Icon size={38} strokeWidth={1.4}/><h3>{content.emptyTitle}</h3><p>{content.emptyText}</p><div className="account-empty-actions"><Link className="button" href={tab==='saved'?'/explore':'/recipes/new'}>{tab==='saved'?'استكشف الوصفات':'ابدأ وصفة'}<ArrowUpLeft size={18}/></Link>{tab!=='saved'&&<Link className="quiet-link" href="/explore">خذ فكرة من وصفة<Compass size={17}/></Link>}</div></section>}
          {pagination}
        </>}
      </div>
    </div>
  </div>;
}
