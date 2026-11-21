import Link from 'next/link';
import type {ReactNode} from 'react';
import {ArrowRight,ArrowUpLeft,BookOpen,Coffee,MapPin,Plus,Settings2,Store} from 'lucide-react';
import type {Profile,Recipe,Viewer} from '@/lib/types';
import {number} from '@/lib/i18n';
import {hasGeneratedUsername} from '@/lib/member-onboarding';
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
  const path='/members/'+profile.username;
  const published=recipes.filter(recipe=>recipe.status==='published'&&!recipe.hidden_at);
  const showCount=typeof totalRecipes==='number'&&Number.isInteger(totalRecipes)&&totalRecipes>=0;
  return <div className="journey-profile journey-member">
    <Link className="journey-profile-back" href="/people"><ArrowRight size={16}/>أهل القهوة</Link>
    <header className="journey-profile-header">
      <div className="journey-profile-avatar"><Avatar profile={profile}/></div>
      <h1>{profile.display_name}</h1>
      {!hasGeneratedUsername(profile.username)&&<p className="journey-profile-handle" dir="ltr">@{profile.username}</p>}
      {profile.bio&&<p className="journey-profile-bio preserve">{profile.bio}</p>}
      {(profile.city||profile.workplace)&&<div className="journey-profile-location">{profile.city&&<span><MapPin size={14}/>{profile.city}</span>}{profile.workplace&&<span><Store size={14}/>{profile.workplace}</span>}</div>}
      <div className="journey-profile-actions">
        {own?<><Link className="button secondary small" href="/account?tab=profile"><Settings2 size={16}/>تعديل الملف</Link><Link className="button small" href="/recipes/new"><Plus size={17}/>وصفة جديدة</Link></>:followingEnabled&&<FollowButton profileId={profile.id} initialFollowing={initialFollowing} signedIn={!!viewer} returnTo={path} displayName={profile.display_name}/>}
        <RecipeShare title={profile.display_name+' · Goat Journey'} path={path} label="مشاركة الملف"/>
      </div>
      {followingEnabled&&!own&&<p className="journey-profile-follow-note">المتابعة مجانية، بلا اشتراك أو رسوم.</p>}
    </header>

    <section className="journey-profile-publications" aria-labelledby="journey-publications-title">
      <div className="journey-profile-tabs journey-profile-feed-title"><h2 id="journey-publications-title"><BookOpen size={18}/>الوصفات{showCount&&<span className="journey-profile-recipe-count"><bdi>{number(totalRecipes!)}</bdi><span className="sr-only"> وصفة منشورة</span></span>}</h2></div>
      {published.length?<CommunityFeed recipes={published} viewer={viewer} savedIds={savedIds} showAuthor={false} headingLevel={3}/>:<div className="journey-profile-empty"><Coffee size={34} strokeWidth={1.4}/><h3>{own?'وصفتك الأولى تبدأ هنا.':'لم تُنشر وصفات بعد.'}</h3><p>{own?'شارك تجربتك عندما تصبح جاهزة. مسوداتك تبقى خاصة بك.':'تعرّف إلى تجارب أخرى من أهل القهوة.'}</p><Link className="button secondary small" href={own?'/recipes/new':'/people'}>{own?'ابدأ وصفة':'اكتشف أهل القهوة'}<ArrowUpLeft size={17}/></Link></div>}
      {pagination}
    </section>
  </div>;
}
