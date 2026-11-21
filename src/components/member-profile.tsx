import Link from 'next/link';
import type {ReactNode} from 'react';
import {ArrowRight,ArrowUpLeft,BookOpen,Coffee,MapPin,Plus,Settings2,ShieldCheck,Store} from 'lucide-react';
import type {Profile,Recipe,Viewer} from '@/lib/types';
import {number} from '@/lib/i18n';
import {Avatar} from './shared';
import {CommunityFeed} from './community-feed';
import {FollowButton} from './follow-button';
import {RecipeShare} from './recipe-share';

type MemberProfileProps={
  profile:Profile;
  recipes:Recipe[];
  viewer:Viewer|null;
  pagination?:ReactNode;
  followingEnabled?:boolean;
  initialFollowing?:boolean;
  totalRecipes?:number;
  savedIds?:string[];
};

export function MemberProfile({profile,recipes,viewer,pagination,followingEnabled=false,initialFollowing=false,totalRecipes,savedIds=[]}:MemberProfileProps){
  const own=viewer?.id===profile.id;
  const path=`/members/${profile.username}`;
  const published=recipes.filter(recipe=>recipe.status==='published'&&!recipe.hidden_at);
  const showCount=typeof totalRecipes==='number'&&Number.isInteger(totalRecipes)&&totalRecipes>=0;
  return <div className="creator-page">
    <Link className="creator-back" href="/people"><ArrowRight size={16}/>أهل القهوة</Link>
    <header className="creator-masthead">
      <div className="creator-masthead-top"><span><BookOpen size={15}/>دفتر من المجتمع</span><span dir="ltr">GOAT JOURNEY</span></div>
      <div className="creator-portrait"><Avatar profile={profile}/></div>
      <p className="creator-kicker">{own?'هذه مساحتك، وهذه حكاية قهوتك':'تجارب تستحق أن نتقاسمها'}</p>
      <h1>{profile.display_name}</h1>
      <p className="creator-handle" dir="ltr">@{profile.username}</p>
      {profile.bio?<p className="creator-bio preserve">{profile.bio}</p>:<p className="creator-bio creator-bio-default">دفتر لوصفات القهوة، والتفاصيل التي تصنع فرقًا في الفنجان.</p>}
      {(profile.city||profile.workplace)&&<div className="creator-location">{profile.city&&<span><MapPin size={15}/>{profile.city}</span>}{profile.workplace&&<span><Store size={15}/>{profile.workplace}</span>}</div>}
      <div className="creator-actions">
        {own?<Link className="button" href="/recipes/new"><Plus size={18}/>اكتب تجربة جديدة</Link>:followingEnabled&&<FollowButton profileId={profile.id} initialFollowing={initialFollowing} signedIn={!!viewer} returnTo={path} displayName={profile.display_name}/>}
        {own&&<Link className="button secondary small" href="/account?tab=profile"><Settings2 size={16}/>تعديل ملفي</Link>}
        <RecipeShare title={`دفتر ${profile.display_name} · Goat Journey`} path={path} label="مشاركة الملف"/>
      </div>
      {followingEnabled&&!own&&<p className="creator-free-note"><ShieldCheck size={14}/>المتابعة مجانية، بلا اشتراك أو رسوم.</p>}
    </header>

    <div className="creator-feed-layout">
      <section className="creator-publications" aria-labelledby="creator-publications-title">
        <div className="creator-feed-heading"><div><span className="overline">من هذا الدفتر</span><h2 id="creator-publications-title">الوصفات والتجارب.</h2></div>{showCount&&<span className="creator-published-count"><bdi>{number(totalRecipes!)}</bdi> وصفة منشورة</span>}</div>
        {published.length?<CommunityFeed recipes={published} viewer={viewer} savedIds={savedIds} showAuthor={false} headingLevel={3}/>:<div className="creator-empty"><Coffee size={36} strokeWidth={1.35}/><h3>{own?'أول تجربة تبدأ منك.':'صفحة جديدة، وتجارب قادمة.'}</h3><p>{own?'دوّن وصفتك، أضف ما تعلّمته، وانشرها عندما تكون جاهزة. مسوداتك تبقى خاصة بك.':'لم يشارك صاحب هذا الدفتر وصفات منشورة بعد. اكتشف دفاتر أخرى من أهل القهوة.'}</p><Link className="button secondary small" href={own?'/recipes/new':'/people'}>{own?'ابدأ وصفة':'اكتشف أهل القهوة'}<ArrowUpLeft size={17}/></Link></div>}
        {pagination}
      </section>
      <aside className="creator-reading-note">
        <img src="/brand/mark.svg" width={34} height={34} alt=""/>
        <span className="overline">المعرفة أحلى لما نتقاسمها</span>
        <h2>وراء الوصفة، صاحب تجربة.</h2>
        <p>اقرأ التفاصيل، حضّر الفنجان، ثم شارك ما تعلّمته في التعليقات. كل تجربة تضيف شيئًا للدفتر.</p>
        <Link className="quiet-link" href="/explore">اكتشف وصفات أخرى<ArrowUpLeft size={16}/></Link>
      </aside>
    </div>
  </div>;
}
