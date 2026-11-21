import Link from 'next/link';
import {ArrowUpLeft,ArrowLeft,PenLine,Search,Users,UserRoundPlus} from 'lucide-react';
import {CommunityFeed,StarterEditorialFeed} from './community-feed';
import type {PageData,Profile,Viewer} from '@/lib/types';
import {publicSignupEnabled} from '@/lib/env';
import {authHref} from '@/lib/auth-navigation';
import {brewingTools} from '@/lib/recipe-builder';
import {findStarterRecipes} from '@/lib/starter-recipes';

type ExploreProps={
  data:PageData;viewer:Viewer|null;q:string;method:string;page:number;
  feed?:'latest'|'following';followingAvailable?:boolean;followedCount?:number;
  members?:Profile[];savedIds?:string[];searchMode?:boolean;
};
const categories=[
  {method:'V60',title:'V60',image:'/images/guides/v60.webp'},
  {method:'French Press',title:'فرنش برس',image:'/images/guides/french-press.webp'},
  {method:'AeroPress',title:'إيروبرس',image:'/images/guides/aeropress.webp'},
  {method:'Espresso',title:'إسبريسو',image:'/images/guides/espresso.webp'},
];
export function Explore({data,viewer,q,method,page,feed='latest',followingAvailable=false,followedCount=0,savedIds=[],searchMode=false}:ExploreProps){
  const signupEnabled=publicSignupEnabled();
  const activeFeed=feed==='following'&&followingAvailable&&viewer?'following':'latest';
  const recipes=data.recipes||[];
  const hasRecipes=recipes.length>0;
  const filtered=Boolean(q||method);
  const guides=findStarterRecipes(q,method);
  const basePath=searchMode?'/search':'/explore';
  const createHref=viewer?'/recipes/new':authHref(signupEnabled?'signup':'login','/recipes/new');
  function feedHref(selected:'latest'|'following',nextPage=0,clear=false,nextMethod=method){
    const query=new URLSearchParams();
    if(selected==='following')query.set('feed',selected);
    if(!clear&&q)query.set('q',q);
    if(!clear&&nextMethod)query.set('method',nextMethod);
    if(nextPage>0)query.set('page',String(nextPage+1));
    return basePath+(query.size?'?'+query:'');
  }
  const followingHref=viewer?feedHref('following'):authHref('login',feedHref('following'));
  const showGuides=activeFeed==='latest'&&page===0&&guides.length>0;
  return <div className={'community-feed-page journey-discover'+(searchMode?' is-search':'')}>
    <header className="journey-discover-heading"><div><h1>{searchMode?'اكتشف فنجانك القادم.':'ماذا سنحضّر اليوم؟'}</h1><p>{searchMode?'وصفة، أداة، أو فكرة تستحق التجربة.':'وصفات وتجارب من أهل القهوة.'}</p></div><Link className="journey-create-link" href={createHref} aria-label="اكتب وصفة"><PenLine size={19}/><span>اكتب وصفة</span></Link></header>
    <form key={JSON.stringify([q,method,activeFeed,searchMode])} className="journey-search" action={basePath} role="search">
      {activeFeed==='following'&&<input type="hidden" name="feed" value="following"/>}
      <div className="journey-search-field"><Search size={20} aria-hidden="true"/><label className="sr-only" htmlFor="recipe-search">ابحث في الوصفات</label><input id="recipe-search" name="q" type="search" defaultValue={q} maxLength={120} autoFocus={searchMode&&!filtered&&page===0&&activeFeed==='latest'} placeholder="ابحث عن وصفة أو نكهة…"/><button type="submit" aria-label="ابحث في الوصفات"><ArrowLeft size={19}/></button></div>
      <div className="journey-filter-row"><label className="journey-method-field" htmlFor="recipe-method"><span className="sr-only">طريقة التحضير</span><select id="recipe-method" name="method" defaultValue={method}><option value="">كل طرق التحضير</option>{method&&!brewingTools.some(([value])=>value===method)&&<option value={method}>{method}</option>}{brewingTools.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><button className="journey-apply-filter" type="submit">تطبيق</button>{filtered&&<Link className="journey-clear-filter" href={feedHref(activeFeed,0,true)}>مسح التصفية</Link>}</div>
    </form>
    <nav className="journey-discover-tabs" aria-label="تصفّح المجتمع"><Link href={feedHref('latest')} aria-current={activeFeed==='latest'?'page':undefined}>الوصفات</Link>{followingAvailable&&<Link href={followingHref} aria-current={activeFeed==='following'?'page':undefined}>أتابعهم</Link>}<Link href="/people"><Users size={16}/><span>أهل القهوة</span></Link></nav>
    {!filtered&&activeFeed==='latest'&&page===0&&<section className="journey-category-section" aria-labelledby="journey-category-title"><h2 id="journey-category-title">حضّر بطريقتك</h2><div className="journey-category-grid">{categories.map(category=><Link className="journey-category" href={feedHref(activeFeed,0,false,category.method)} key={category.method}><span>{category.title}</span><img src={category.image} alt="" width={180} height={180} loading="lazy" decoding="async"/></Link>)}</div></section>}
    <section className="journey-results" aria-label="وصفات المجتمع">
      {hasRecipes&&<><header className="journey-section-heading"><h2>{activeFeed==='following'?'من الأشخاص الذين تتابعهم':filtered?'نتائج البحث':'من دفاتر المجتمع'}</h2>{typeof data.total==='number'&&<span>{data.total} وصفة</span>}</header><CommunityFeed recipes={recipes} viewer={viewer} savedIds={savedIds}/></>}
      {!hasRecipes&&activeFeed==='following'&&<section className="journey-empty"><UserRoundPlus size={30}/><h2>{page>0?'لا توجد وصفات في هذه الصفحة.':filtered?'لا توجد وصفات مطابقة في متابعاتك.':followedCount>0?'تجاربهم القادمة ستظهر هنا.':'تابع من يلهمك.'}</h2><p>{page>0?'ارجع إلى أول صفحة لعرض الوصفات المتاحة.':filtered?'جرّب كلمة أخرى أو امسح التصفية.':followedCount>0?'لم ينشر الأشخاص الذين تتابعهم وصفات بعد. اكتشف بقية المجتمع في هذه الأثناء.':'تعرّف على أهل القهوة، واجمع جديد وصفاتهم هنا.'}</p><Link className="journey-text-link" href={page>0?feedHref(activeFeed):filtered?feedHref(activeFeed,0,true):'/people'}>{page>0?'الصفحة الأولى':filtered?'مسح التصفية':'اكتشف أهل القهوة'}<ArrowUpLeft size={17}/></Link></section>}
      {!hasRecipes&&activeFeed==='latest'&&!showGuides&&<section className="journey-empty"><Search size={29}/><h2>{filtered?'لم نجد وصفة بهذه التفاصيل.':'لا توجد وصفات في هذه الصفحة.'}</h2><p>جرّب كلمة أخرى أو تصفّح كل طرق التحضير.</p><Link className="journey-text-link" href={feedHref(activeFeed,0,true)}>عرض الوصفات<ArrowLeft size={17}/></Link></section>}
      {!hasRecipes&&filtered&&showGuides&&<p className="journey-result-note">لا توجد وصفات أعضاء مطابقة بعد. قد تجد فكرتك في أدلة البداية.</p>}
      {showGuides&&<StarterEditorialFeed recipes={guides}/>}
      {!hasRecipes&&!filtered&&activeFeed==='latest'&&page===0&&<section className="journey-first-recipe"><img src="/brand/mark.svg" width={34} height={34} alt=""/><div><h2>أول تجربة في المجتمع، بتوقيعك.</h2><p>لم تُنشر وصفات أعضاء بعد. شارك ما حضّرته وما تعلّمته.</p></div><Link className="journey-text-link" href={createHref}>شارك وصفتك<ArrowUpLeft size={17}/></Link></section>}
    </section>
    {(page>0||data.hasMore)&&<nav className="journey-pagination" aria-label="صفحات وصفات المجتمع">{page>0?<Link href={feedHref(activeFeed,page-1)}>السابق</Link>:<span/>}<span>صفحة {page+1}</span>{data.hasMore?<Link href={feedHref(activeFeed,page+1)}>التالي<ArrowLeft size={16}/></Link>:<span/>}</nav>}
  </div>;
}
