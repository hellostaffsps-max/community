import Link from 'next/link';
import {ArrowUpLeft,ArrowLeft,MapPin,Search,UsersRound} from 'lucide-react';
import {Avatar} from './shared';
import {FollowButton} from './follow-button';
import {authHref} from '@/lib/auth-navigation';
import {publicSignupEnabled} from '@/lib/env';
import type {Profile,Viewer} from '@/lib/types';

export function People({members,viewer,q,page,hasMore,total,view,followingEnabled,followedIds}:{members:Profile[];viewer:Viewer|null;q:string;page:number;hasMore:boolean;total:number;view:'all'|'following';followingEnabled:boolean;followedIds:string[]}){
  const following=view==='following';
  const href=(p:number,nextView=view)=>{
    const query=new URLSearchParams();
    if(q)query.set('q',q);
    if(nextView==='following')query.set('view',nextView);
    if(p>0)query.set('page',String(p+1));
    return '/people'+(query.size?'?'+query:'');
  };
  const followingHref=href(0,'following');
  return <div className="people-page journey-people">
    <header className="journey-discover-heading"><div><h1>أهل القهوة.</h1><p>تعرّف على أصحاب الوصفات والتجارب.</p></div><Link className="journey-back-recipes" href="/explore">الوصفات<ArrowUpLeft size={18}/></Link></header>
    <form action="/people" role="search" className="journey-search" key={q+'-'+view}><input type="hidden" name="view" value={view}/><div className="journey-search-field"><Search size={20} aria-hidden="true"/><label className="sr-only" htmlFor="people-search">ابحث باسم الشخص</label><input id="people-search" name="q" type="search" defaultValue={q} maxLength={120} placeholder="ابحث باسم الشخص…"/><button type="submit" aria-label="ابحث باسم الشخص"><ArrowLeft size={19}/></button></div>{q&&<Link className="journey-clear-filter" href={following?'/people?view=following':'/people'}>مسح البحث</Link>}</form>
    <nav className="journey-discover-tabs" aria-label="تصفّح أهل القهوة"><Link href={href(0,'all')} aria-current={!following?'page':undefined}>اكتشف الأشخاص</Link>{followingEnabled&&<Link href={viewer?followingHref:authHref('login',followingHref)} aria-current={following?'page':undefined}>أتابعهم</Link>}</nav>
    {members.length?<><p className="journey-result-note">{total} {following?'شخصًا من الذين تتابعهم':'شخصًا في دليل المجتمع'}</p><div className="journey-people-list">{members.map(profile=><article className="journey-person" key={profile.id}>
      <div className="journey-person-top"><Link className="journey-person-identity" href={'/members/'+profile.username}><Avatar profile={profile}/><span><h2>{profile.display_name}</h2><bdi>@{profile.username}</bdi></span></Link>{followingEnabled&&viewer?.id!==profile.id&&<FollowButton profileId={profile.id} displayName={profile.display_name} initialFollowing={followedIds.includes(profile.id)} signedIn={!!viewer} returnTo={'/members/'+profile.username}/>}</div>
      {profile.bio&&<p className="journey-person-bio">{profile.bio}</p>}
      <div className="journey-person-bottom">{profile.city?<span><MapPin size={13}/>{profile.city}</span>:<span/>}<Link href={'/members/'+profile.username}>افتح دفتره<ArrowUpLeft size={16}/></Link></div>
    </article>)}</div></>:<section className="journey-empty"><UsersRound size={34} strokeWidth={1.4}/><h2>{page>0?'لا يوجد أشخاص في هذه الصفحة.':q?'لم نجد اسمًا مطابقًا.':following?'تعرّف على أهل القهوة.':'كل دفتر يبدأ بشخص.'}</h2><p>{page>0?'ارجع إلى أول صفحة لعرض الأشخاص المتاحين.':q?'جرّب اسمًا أقصر أو امسح البحث.':following?'تابع أصحاب التجارب التي تحبها، لتجد وصفاتهم في صفحة «أتابعهم».':'أكمل اسمك ونبذتك ليجدك أهل المجتمع هنا.'}</p><Link className="journey-text-link" href={page>0?href(0):q?(following?'/people?view=following':'/people'):following?'/people':viewer?'/account?tab=profile':authHref(publicSignupEnabled()?'signup':'login','/account?tab=profile')}>{page>0?'الصفحة الأولى':q?'عرض الأشخاص':following?'اكتشف الأشخاص':'عرّفنا بنفسك'}<ArrowUpLeft size={17}/></Link></section>}
    {(page>0||hasMore)&&<nav className="journey-pagination" aria-label="صفحات أهل القهوة">{page>0?<Link href={href(page-1)}>السابق</Link>:<span/>}<span>صفحة {page+1}</span>{hasMore?<Link href={href(page+1)}>التالي<ArrowLeft size={16}/></Link>:<span/>}</nav>}
  </div>;
}
