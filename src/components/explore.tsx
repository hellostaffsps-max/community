import Link from 'next/link';
import {ArrowUpLeft,ArrowLeft,BookOpen,PenLine,Search,Users,UserRoundPlus} from 'lucide-react';
import {Avatar} from './shared';
import {CommunityFeed,StarterEditorialFeed} from './community-feed';
import type {PageData,Profile,Viewer} from '@/lib/types';
import {publicSignupEnabled} from '@/lib/env';
import {authHref} from '@/lib/auth-navigation';
import {brewingTools} from '@/lib/recipe-builder';
import {findStarterRecipes} from '@/lib/starter-recipes';

type ExploreProps={
  data:PageData;viewer:Viewer|null;q:string;method:string;page:number;
  feed?:'latest'|'following';followingAvailable?:boolean;followedCount?:number;
  members?:Profile[];savedIds?:string[];
};

export function Explore({data,viewer,q,method,page,feed='latest',followingAvailable=false,followedCount=0,members=[],savedIds=[]}:ExploreProps){
  const signupEnabled=publicSignupEnabled();
  const activeFeed=feed==='following'&&followingAvailable&&viewer?'following':'latest';
  const recipes=data.recipes||[];
  const hasRecipes=recipes.length>0;
  const filtered=Boolean(q||method);
  const guides=findStarterRecipes(q,method);
  const createHref=viewer?'/recipes/new':authHref(signupEnabled?'signup':'login','/recipes/new');
  function feedHref(selected:'latest'|'following',nextPage=0,clear=false){
    const query=new URLSearchParams();
    if(selected==='following')query.set('feed',selected);
    if(!clear&&q)query.set('q',q);
    if(!clear&&method)query.set('method',method);
    if(nextPage>0)query.set('page',String(nextPage+1));
    return '/explore'+(query.size?'?'+query:'');
  }
  const followingHref=viewer?feedHref('following'):authHref('login',feedHref('following'));
  const emptyFollowing=activeFeed==='following'&&!hasRecipes&&!filtered;
  const showReferenceFeed=!hasRecipes&&guides.length>0;

  return <div className="community-feed-page">
    <header className="feed-page-heading"><div><span className="feed-kicker">GOAT JOURNEY / من دفاتر أهل القهوة</span><h1>ماذا سنحضّر اليوم؟</h1><p>اقرأ تجربة، تعرّف على صاحبها، وخذ فكرة لفنجانك القادم.</p></div><Link className="feed-write-link" href={createHref}><PenLine size={18}/><span>اكتب وصفة</span></Link></header>
    <div className="feed-layout">
      <section className="feed-main" aria-label="وصفات المجتمع">
        <nav className="feed-tabs" aria-label="تصفّح المجتمع">
          <Link href={feedHref('latest')} aria-current={activeFeed==='latest'?'page':undefined}>الأحدث</Link>
          {followingAvailable&&<Link href={followingHref} aria-current={activeFeed==='following'?'page':undefined}>أتابعهم{viewer&&followedCount>0&&<span className="feed-tab-count">{followedCount}</span>}</Link>}
          <Link href="/people" className="feed-people-tab"><Users size={16}/><span>أهل القهوة</span></Link>
        </nav>
        <form key={JSON.stringify([q,method,activeFeed])} className="feed-search" action="/explore" role="search">
          {activeFeed==='following'&&<input type="hidden" name="feed" value="following"/>}
          <div className="feed-search-field"><Search size={17}/><label className="sr-only" htmlFor="recipe-search">ابحث في الوصفات</label><input id="recipe-search" name="q" defaultValue={q} maxLength={120} placeholder="ابحث عن وصفة أو نكهة…"/></div>
          <label className="feed-method-field" htmlFor="recipe-method"><span className="sr-only">طريقة التحضير</span><select id="recipe-method" name="method" defaultValue={method}><option value="">كل الطرق</option>{method&&!brewingTools.some(([value])=>value===method)&&<option value={method}>{method}</option>}{brewingTools.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          <button type="submit" className="feed-search-submit">بحث</button>
          {filtered&&<div className="feed-active-filter"><span>{method||'نتائج البحث'}{q&&<span> · «{q}»</span>}</span><Link href={feedHref(activeFeed,0,true)}>مسح التصفية</Link></div>}
        </form>
        <div className="feed-stream">
          {hasRecipes&&<><div className="feed-results-label"><span>{activeFeed==='following'?'من الأشخاص الذين تتابعهم':'من دفاتر المجتمع'}</span>{typeof data.total==='number'&&<span>{data.total} وصفة</span>}</div><CommunityFeed recipes={recipes} viewer={viewer} savedIds={savedIds}/></>}
          {emptyFollowing&&<section className="feed-empty-following"><UserRoundPlus size={26}/><h2>{followedCount>0?'كل تجربة جديدة ستصل إلى هنا.':'ابدأ بالأشخاص الذين يلهمونك.'}</h2><p>{followedCount>0?'لم ينشر الأشخاص الذين تتابعهم وصفات بعد. يمكنك قراءة تجارب المجتمع أو العودة لاحقًا.':'تعرّف على أهل القهوة وتابع أصحاب التجارب التي تحبها، لتجد وصفاتهم في مكان واحد.'}</p><Link className="feed-read-link" href="/people">اكتشف أهل القهوة<ArrowUpLeft size={17}/></Link></section>}
          {!hasRecipes&&!showReferenceFeed&&!emptyFollowing&&<section className="feed-no-results"><Search size={25}/><h2>{filtered?'لم نجد وصفة بهذه التفاصيل.':'الصفحة التالية تبدأ بتجربة جديدة.'}</h2><p>جرّب كلمات أبسط أو تصفّح الوصفات بكل طرق التحضير.</p><Link className="feed-read-link" href={feedHref(activeFeed,0,true)}>عرض الوصفات<ArrowLeft size={17}/></Link></section>}
          {showReferenceFeed&&<StarterEditorialFeed recipes={guides}/>}
          {!hasRecipes&&!filtered&&activeFeed==='latest'&&<section className="feed-first-contribution"><span className="feed-kicker">المجتمع في بدايته</span><h2>والتجربة القادمة، بتوقيعك.</h2><p>لم تُنشر وصفات أعضاء بعد. ابدأ من أحد الأدلة، أو شارك وصفتك وملاحظاتك ليقرأها غيرك.</p><Link className="feed-read-link" href={createHref}>شارك أول تجربة<ArrowUpLeft size={17}/></Link></section>}
        </div>
        {(page>0||data.hasMore)&&<nav className="feed-pagination" aria-label="صفحات وصفات المجتمع">{page>0?<Link href={feedHref(activeFeed,page-1)}>السابق</Link>:<span/>}<span>صفحة {page+1}</span>{data.hasMore?<Link href={feedHref(activeFeed,page+1)}>التالي<ArrowLeft size={16}/></Link>:<span/>}</nav>}
      </section>
      <aside className="feed-rail" aria-label="اكتشف المزيد من المجتمع">
        <section className="feed-people-preview"><div className="feed-rail-heading"><h2>أهل القهوة.</h2><Link href="/people" aria-label="اكتشف كل أهل القهوة"><ArrowUpLeft size={18}/></Link></div>
          {members.length>0?<div className="feed-member-list">{members.slice(0,4).map(member=><Link className="feed-member" href={'/members/'+member.username} key={member.id}><Avatar profile={member}/><span><strong>{member.display_name}</strong><small>{member.bio||member.city||'من أهل القهوة'}</small></span><ArrowUpLeft size={15}/></Link>)}</div>:<p className="feed-rail-copy">المجتمع يبدأ بالتعارف. عرّفنا بنفسك وبالطريقة التي تحب أن تحضّر بها قهوتك.</p>}
          <Link className="feed-rail-link" href="/people">اكتشف الأعضاء<ArrowUpLeft size={15}/></Link>
        </section>
        {hasRecipes&&guides.length>0&&<section className="feed-guide-rail"><div className="feed-rail-heading"><h2>وصفات البداية.</h2><BookOpen size={17}/></div><p className="feed-rail-copy">أدلة مرجعية تعود إليها وقت التحضير.</p>{guides.map(guide=><Link className="feed-mini-guide" href={'/learn/'+guide.slug} key={guide.slug}><span><small>{guide.method}</small><strong>{guide.title}</strong></span><ArrowUpLeft size={16}/></Link>)}</section>}
        <section className="feed-writing-invite"><img src="/brand/mark.svg" width={35} height={35} alt=""/><span className="feed-kicker">من فنجان إلى حكاية</span><h2>دوّن ما صنع الفرق.</h2><p>الطحنة التي ضبطتها، أو الملاحظة التي غيّرت النتيجة. هذه التفاصيل هي ما نحب قراءته.</p><Link className="button small" href={createHref}>{viewer?'افتح دفتر الوصفات':signupEnabled?'ابدأ دفترك مجانًا':'دخول الأعضاء'}<ArrowUpLeft size={17}/></Link><small>{signupEnabled?'بلا اشتراك أو رسوم.':'التصفّح متاح للجميع.'}</small></section>
        <div className="feed-rail-footer"><span>GOAT JOURNEY COMMUNITY</span><Link href="/#about">عن المجتمع</Link></div>
      </aside>
    </div>
  </div>;
}
