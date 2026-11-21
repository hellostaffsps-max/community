import Link from 'next/link';
import type {Metadata} from 'next';
import {notFound,redirect} from 'next/navigation';
import {Coffee} from 'lucide-react';
import {supabase} from '@/lib/supabase/server';
import {viewer as getViewer,explore,detail,account,reports,people,savedRecipeIds} from '@/lib/data';
import type {PageData,Viewer,Profile} from '@/lib/types';
import {connection,publicSignupEnabled} from '@/lib/env';
import {HttpError} from '@/lib/http';
import {uuid} from '@/lib/validation';
import {Shell} from '@/components/shell';
import {Landing} from '@/components/landing';
import {Explore} from '@/components/explore';
import {MemberProfile} from '@/components/member-profile';
import {People} from '@/components/people';
import {getCommunitySocial,type CommunitySocialState} from '@/lib/community-social';
import {AuthForm} from '@/components/auth-form';
import {RecipeEditor} from '@/components/recipe-editor';
import {RecipeDetail} from '@/components/recipe-detail';
import {AccountPage} from '@/components/account-page';
import {Moderation} from '@/components/moderation';
import {StarterRecipeDetail} from '@/components/starter-recipes';
import {getStarterRecipe,starterToInput} from '@/lib/starter-recipes';
import {authHref,safeAuthNext} from '@/lib/auth-navigation';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug?:string[]}>}):Promise<Metadata>{
 const path=(await params).slug||[];
 if(path[0]==='learn'&&path.length===2){const recipe=getStarterRecipe(path[1]);if(recipe)return {title:recipe.title,description:recipe.description,openGraph:{title:recipe.title,description:recipe.description,type:'article',url:`https://goatlab.my/learn/${recipe.slug}`,siteName:'Goat Journey Community'},twitter:{card:'summary',title:recipe.title,description:recipe.description}};}
 if(path[0]==='auth'||path[0]==='account'||path[0]==='moderation'||path[1]==='new'||path[2]==='edit')return {robots:{index:false,follow:false}};
 return {};
}
function Pagination({page,more,base,query}:{page:number;more?:boolean;base:string;query:Record<string,string>}){function href(p:number){return `${base}?${new URLSearchParams({...query,page:String(p+1)})}`;}return (page>0||more)?<nav className="pagination" aria-label="صفحات النتائج">{page>0&&<Link className="button secondary small" href={href(page-1)}>السابق</Link>}<span>صفحة {page+1}</span>{more&&<Link className="button secondary small" href={href(page+1)}>التالي</Link>}</nav>:null;}
export default async function CommunityPage({params,searchParams}:{params:Promise<{slug?:string[]}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const path=(await params).slug||[];const search=await searchParams;const value=(key:string)=>typeof search[key]==='string'?search[key] as string:'';const page=Math.min(1000,Math.max(0,(Number.parseInt(value('page'),10)||1)-1));const q=value('q').slice(0,120);const method=value('method').slice(0,80);const tab=['drafts','saved','profile'].includes(value('tab'))?value('tab'):'published';
 const feed=value('feed')==='following'?'following':'latest';const peopleView=value('view')==='following'?'following':'all';
 const route=path.join('/');const isDiscovery=route==='explore'||route==='search';const isAuth=path[0]==='auth'&&path.length===2&&['login','signup','forgot','reset','resend','verify'].includes(path[1]);const isNew=route==='recipes/new';const isDetail=path[0]==='recipes'&&path.length===2&&!isNew;const isEdit=path[0]==='recipes'&&path.length===3&&path[2]==='edit';const isMember=path[0]==='members'&&path.length===2;
 const isLearn=path[0]==='learn'&&path.length===2;const starter=isLearn?getStarterRecipe(path[1]):undefined;const template=isNew&&value('template')?getStarterRecipe(value('template')):undefined;
 if(!(route===''||isDiscovery||route==='people'||route==='account'||route==='moderation'||isAuth||isNew||isDetail||isEdit||isMember||isLearn))notFound();
 if((isLearn&&!starter)||(isNew&&value('template')&&!template))notFound();
 if(route===''&&['q','method','page'].some(key=>key in search))redirect('/explore?'+new URLSearchParams({q,method,page:String(page+1)}));
 if((isDetail||isEdit)&&!uuid.safeParse(path[1]).success)notFound();
 let viewer:Viewer|null=null;let data:PageData={};let social:CommunitySocialState={available:false,followedIds:[],followingCount:0};let unavailable=false;let missing=false;let denied=false;
 try{
   if(!connection())throw new Error('connection_not_configured');const client=await supabase();viewer=await getViewer(client);
   if(!isAuth){
     if(isDiscovery||route==='people'||isMember||isDetail)social=await getCommunitySocial(client,viewer?.id);
     if(isDiscovery){const [recipes,members]=await Promise.all([explore(client,q,method,page,undefined,feed==='following'?social.followedIds:undefined),people(client,'',0)]);data={...recipes,members:members.members.slice(0,4)};}
     else if(route==='people')data=await people(client,q,page,peopleView==='following'?social.followedIds:undefined);
     else if(isDetail||isEdit){data=await detail(client,path[1],viewer?.id);if(isEdit&&(data.recipe?.owner_id!==viewer?.id||data.recipe?.hidden_at))denied=true;}
     else if(route==='account'&&viewer)data=await account(client,viewer.id,tab,page);
     else if(route==='moderation'&&viewer?.moderator)data=await reports(client,page);
     else if(isMember){const {data:profile,error}=await client.from('profiles').select('*').eq('username',path[1]).maybeSingle<Profile>();if(error)throw error;if(!profile)missing=true;else data={profile,...await explore(client,'','',page,profile.id)};}
     if(data.recipes)data.savedIds=await savedRecipeIds(client,viewer?.id,data.recipes);
     if((isNew||isEdit)&&viewer&&!denied){const {data:categories,error}=await client.from('beverage_categories').select('id,name_ar').order('name_ar');if(error)throw error;data.categories=categories||[];}
   }
 }catch(error){if(error instanceof HttpError&&error.status===404)missing=true;else{unavailable=true;console.error(JSON.stringify({event:'page_data_unavailable',code:(error as {code?:string}).code||'connection'}));}}
 if(missing)notFound();
 const destinationQuery=new URLSearchParams();if(isNew&&template)destinationQuery.set('template',template.slug);if(route==='account'&&value('tab'))destinationQuery.set('tab',tab);if(isDiscovery){if(feed==='following')destinationQuery.set('feed','following');if(q)destinationQuery.set('q',q);if(method)destinationQuery.set('method',method);if(page>0)destinationQuery.set('page',String(page+1));}if(route==='people'){if(peopleView==='following')destinationQuery.set('view','following');if(q)destinationQuery.set('q',q);if(page>0)destinationQuery.set('page',String(page+1));}
 const destination=`/${route}${destinationQuery.size?`?${destinationQuery}`:''}`;
 if((isNew||isEdit||route==='account'||route==='moderation'||route==='auth/reset'||(isDiscovery&&feed==='following')||(route==='people'&&peopleView==='following'))&&!viewer&&!unavailable)redirect(authHref('login',destination));
 if((route==='moderation'&&!viewer?.moderator)||denied)return <Shell viewer={viewer}><div className="empty"><h1>هذه الصفحة غير متاحة لحسابك.</h1><Link className="button" href="/">العودة للمجتمع</Link></div></Shell>;
 if(!unavailable&&!social.available&&((isDiscovery&&feed==='following')||(route==='people'&&peopleView==='following')))redirect(isDiscovery?'/'+route:'/people');
 if(isAuth&&viewer&&['login','signup'].includes(path[1]))redirect(safeAuthNext(value('next')));
 if(isAuth)return <Shell viewer={viewer} active={route} authNext={safeAuthNext(value('next'))}><AuthForm key={`${path[1]}-${value('next')}`} mode={path[1]} returnTo={safeAuthNext(value('next'))} signupEnabled={!unavailable&&publicSignupEnabled()} confirmationError={!!value('error')} oauthError={value('error')==='oauth'}/></Shell>;
 if(route==='')return <Shell viewer={viewer} landing><Landing signedIn={!!viewer}/></Shell>;
 if(isLearn&&starter)return <Shell viewer={viewer} active={route}><StarterRecipeDetail recipe={starter} signedIn={!!viewer}/></Shell>;
 if(unavailable)return <Shell viewer={viewer}><section className="connection-state"><Coffee size={40} strokeWidth={1.2}/><span className="eyebrow">GOAT JOURNEY COMMUNITY</span><h1>نحضّر المساحة لتجاربكم.</h1><p>تعذّر تحميل المجتمع الآن. حاول مجددًا بعد قليل.</p><Link className="button" href="/">إعادة المحاولة</Link></section></Shell>;
 return <Shell viewer={viewer} active={route} accountTab={tab} authNext={destination}>
 {isDiscovery&&<Explore searchMode={route==='search'} data={data} viewer={viewer} q={q} method={method} page={page} feed={feed} followingAvailable={social.available} followedCount={social.followingCount} members={data.members} savedIds={data.savedIds}/>}
 {route==='people'&&<People members={data.members||[]} viewer={viewer} q={q} page={page} hasMore={!!data.hasMore} total={data.total||0} view={peopleView} followingEnabled={social.available} followedIds={social.followedIds}/>}
 {(isNew||isEdit)&&<RecipeEditor key={data.recipe?`${data.recipe.id}-${data.recipe.version}`:`new-${template?.slug||'blank'}`} ownerId={viewer!.id} recipe={data.recipe} template={template?starterToInput(template):undefined} templateKey={template?.slug} categories={data.categories||[]}/>}
 {isDetail&&data.recipe&&<RecipeDetail key={data.recipe.id} recipe={data.recipe} comments={data.comments||[]} initialSaved={data.saved||false} viewer={viewer} followingEnabled={social.available} initialFollowing={social.followedIds.includes(data.recipe.owner_id)}/>}
 {route==='account'&&data.profile&&<AccountPage profile={data.profile} recipes={data.recipes||[]} tab={tab} pagination={<Pagination page={page} more={data.hasMore} base="/account" query={{tab}}/>}/>}
 {isMember&&data.profile&&<MemberProfile profile={data.profile} recipes={data.recipes||[]} viewer={viewer} followingEnabled={social.available} initialFollowing={social.followedIds.includes(data.profile.id)} totalRecipes={data.total} savedIds={data.savedIds} pagination={<Pagination page={page} more={data.hasMore} base={`/members/${path[1]}`} query={{}}/>}/>}
 {route==='moderation'&&<><div className="page-heading"><span className="eyebrow">للمشرفين</span><h1>مساحة آمنة للتجارب.</h1><p>راجع سياق البلاغ قبل اتخاذ القرار. الإجراءات تُسجّل للمراجعة.</p></div><Moderation reports={data.reports||[]}/><Pagination page={page} more={data.hasMore} base="/moderation" query={{}}/></>}
 </Shell>;
}
