import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import {Coffee,MapPin} from 'lucide-react';
import {supabase} from '@/lib/supabase/server';
import {viewer as getViewer,explore,detail,account,reports} from '@/lib/data';
import type {PageData,Viewer,Profile} from '@/lib/types';
import {connection} from '@/lib/env';
import {HttpError} from '@/lib/http';
import {uuid} from '@/lib/validation';
import {Shell} from '@/components/shell';
import {Landing} from '@/components/landing';
import {Explore} from '@/components/explore';
import {Avatar,Cards,Notice} from '@/components/shared';
import {AuthForm} from '@/components/auth-form';
import {RecipeEditor} from '@/components/recipe-editor';
import {RecipeDetail} from '@/components/recipe-detail';
import {ProfileForm,SignOut} from '@/components/account';
import {Moderation} from '@/components/moderation';
export const dynamic='force-dynamic';
function Pagination({page,more,base,query}:{page:number;more?:boolean;base:string;query:Record<string,string>}){function href(p:number){return `${base}?${new URLSearchParams({...query,page:String(p+1)})}`;}return (page>0||more)?<nav className="pagination" aria-label="صفحات النتائج">{page>0&&<Link className="button secondary small" href={href(page-1)}>السابق</Link>}<span>صفحة {page+1}</span>{more&&<Link className="button secondary small" href={href(page+1)}>التالي</Link>}</nav>:null;}
export default async function CommunityPage({params,searchParams}:{params:Promise<{slug?:string[]}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const path=(await params).slug||[];const search=await searchParams;const value=(key:string)=>typeof search[key]==='string'?search[key] as string:'';const page=Math.min(1000,Math.max(0,(Number.parseInt(value('page'),10)||1)-1));const q=value('q').slice(0,120);const method=value('method').slice(0,80);const tab=['drafts','saved','profile'].includes(value('tab'))?value('tab'):'published';
 const route=path.join('/');const isAuth=path[0]==='auth'&&path.length===2&&['login','signup','forgot','reset','resend'].includes(path[1]);const isNew=route==='recipes/new';const isDetail=path[0]==='recipes'&&path.length===2&&!isNew;const isEdit=path[0]==='recipes'&&path.length===3&&path[2]==='edit';const isMember=path[0]==='members'&&path.length===2;
 if(!(route===''||route==='explore'||route==='account'||route==='moderation'||isAuth||isNew||isDetail||isEdit||isMember))notFound();
 if(route===''&&['q','method','page'].some(key=>key in search))redirect('/explore?'+new URLSearchParams({q,method,page:String(page+1)}));
 if((isDetail||isEdit)&&!uuid.safeParse(path[1]).success)notFound();
 let viewer:Viewer|null=null;let data:PageData={};let unavailable=false;let missing=false;let denied=false;
 try{
   if(!connection())throw new Error('connection_not_configured');const client=await supabase();viewer=await getViewer(client);
   if(!isAuth){
     if(route==='explore')data=await explore(client,q,method,page);
     else if(isDetail||isEdit){data=await detail(client,path[1],viewer?.id);if(isEdit&&(data.recipe?.owner_id!==viewer?.id||data.recipe?.hidden_at))denied=true;}
     else if(route==='account'&&viewer)data=await account(client,viewer.id,tab,page);
     else if(route==='moderation'&&viewer?.moderator)data=await reports(client,page);
     else if(isMember){const {data:profile,error}=await client.from('profiles').select('*').eq('username',path[1]).maybeSingle<Profile>();if(error)throw error;if(!profile)missing=true;else data={profile,...await explore(client,'','',page,profile.id)};}
     if((isNew||isEdit)&&viewer&&!denied){const {data:categories,error}=await client.from('beverage_categories').select('id,name_ar').order('name_ar');if(error)throw error;data.categories=categories||[];}
   }
 }catch(error){if(error instanceof HttpError&&error.status===404)missing=true;else{unavailable=true;console.error(JSON.stringify({event:'page_data_unavailable',code:(error as {code?:string}).code||'connection'}));}}
 if(missing)notFound();
 if((isNew||isEdit||route==='account'||route==='moderation'||route==='auth/reset')&&!viewer&&!unavailable)redirect('/auth/login');
 if((route==='moderation'&&!viewer?.moderator)||denied)return <Shell viewer={viewer}><div className="empty"><h1>هذه الصفحة غير متاحة لحسابك.</h1><Link className="button" href="/">العودة للمجتمع</Link></div></Shell>;
 if(isAuth)return <Shell viewer={viewer}><AuthForm mode={path[1]} signupEnabled={!unavailable&&process.env.ALLOW_PUBLIC_SIGNUP==='true'&&!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} confirmationError={!!value('error')}/></Shell>;
 if(route==='')return <Shell viewer={viewer} landing><Landing/></Shell>;
 if(unavailable)return <Shell viewer={viewer}><section className="connection-state"><Coffee size={40} strokeWidth={1.2}/><span className="eyebrow">GOAT JOURNEY COMMUNITY</span><h1>نحضّر المساحة لتجاربكم.</h1><p>تعذّر تحميل المجتمع الآن. حاول مجددًا بعد قليل.</p><Link className="button" href="/">إعادة المحاولة</Link></section></Shell>;
 return <Shell viewer={viewer} active={route}>
 {route==='explore'&&<Explore data={data} viewer={viewer} q={q} method={method} page={page}/>}
 {(isNew||isEdit)&&<RecipeEditor key={data.recipe?`${data.recipe.id}-${data.recipe.version}`:'new'} recipe={data.recipe} categories={data.categories||[]}/>}
 {isDetail&&data.recipe&&<RecipeDetail recipe={data.recipe} comments={data.comments||[]} initialSaved={data.saved||false} viewer={viewer}/>}
 {route==='account'&&data.profile&&<><section className="profile-heading"><Avatar profile={data.profile}/><div><span className="eyebrow">دفتر تجاربك</span><h1>{data.profile.display_name}</h1><p dir="ltr">@{data.profile.username}</p></div><SignOut/></section><nav className="account-tabs" aria-label="أقسام الحساب">{[['published','وصفاتي'],['drafts','المسودات'],['saved','المحفوظات'],['profile','تعديل الملف']].map(([key,label])=><Link aria-current={tab===key?'page':undefined} className={tab===key?'active':''} key={key} href={`/account?tab=${key}`}>{label}</Link>)}</nav>{tab==='profile'?<ProfileForm profile={data.profile}/>:<>{tab==='drafts'&&<Notice>مسوداتك وصورها ظاهرة لك وحدك.</Notice>}{tab==='saved'&&<Notice>قائمتك خاصة. الوصفات المحذوفة أو المخفية لا تظهر هنا.</Notice>}<Cards recipes={data.recipes||[]}/><Pagination page={page} more={data.hasMore} base="/account" query={{tab}}/></>}</>}
 {isMember&&data.profile&&<><section className="profile-heading"><Avatar profile={data.profile}/><div><span className="eyebrow">من أهل القهوة</span><h1>{data.profile.display_name}</h1><p dir="ltr">@{data.profile.username}</p>{data.profile.city&&<p><MapPin size={16}/>{data.profile.city}{data.profile.workplace&&` · ${data.profile.workplace}`}</p>}<p className="preserve">{data.profile.bio}</p></div></section><h2>وصفات شاركها مع المجتمع</h2><Cards recipes={data.recipes||[]}/><Pagination page={page} more={data.hasMore} base={`/members/${path[1]}`} query={{}}/></>}
 {route==='moderation'&&<><div className="page-heading"><span className="eyebrow">للمشرفين</span><h1>مساحة آمنة للتجارب.</h1><p>راجع سياق البلاغ قبل اتخاذ القرار. الإجراءات تُسجّل للمراجعة.</p></div><Moderation reports={data.reports||[]}/><Pagination page={page} more={data.hasMore} base="/moderation" query={{}}/></>}
 </Shell>;
}
