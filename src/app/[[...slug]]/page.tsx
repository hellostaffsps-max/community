import Link from 'next/link';
import {notFound,redirect} from 'next/navigation';
import {ArrowUpLeft,Search,Coffee,MapPin} from 'lucide-react';
import {supabase} from '@/lib/supabase/server';
import {viewer as getViewer,explore,detail,account,reports} from '@/lib/data';
import type {PageData,Viewer,Profile} from '@/lib/types';
import {connection} from '@/lib/env';
import {HttpError} from '@/lib/http';
import {uuid} from '@/lib/validation';
import {Shell} from '@/components/shell';
import {Avatar,Cards,Notice} from '@/components/shared';
import {AuthForm} from '@/components/auth-form';
import {RecipeEditor} from '@/components/recipe-editor';
import {RecipeDetail} from '@/components/recipe-detail';
import {ProfileForm,SignOut} from '@/components/account';
import {Moderation} from '@/components/moderation';
export const dynamic='force-dynamic';
const methods=['V60','Espresso','AeroPress','French Press','Cold Brew','Turkish'];
function Pagination({page,more,base,query}:{page:number;more?:boolean;base:string;query:Record<string,string>}){function href(p:number){return `${base}?${new URLSearchParams({...query,page:String(p+1)})}`;}return (page>0||more)?<nav className="pagination" aria-label="صفحات النتائج">{page>0&&<Link className="button secondary small" href={href(page-1)}>السابق</Link>}<span>صفحة {page+1}</span>{more&&<Link className="button secondary small" href={href(page+1)}>التالي</Link>}</nav>:null;}
export default async function CommunityPage({params,searchParams}:{params:Promise<{slug?:string[]}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const path=(await params).slug||[];const search=await searchParams;const value=(key:string)=>typeof search[key]==='string'?search[key] as string:'';const page=Math.min(1000,Math.max(0,(Number.parseInt(value('page'),10)||1)-1));const q=value('q').slice(0,120);const method=value('method').slice(0,80);const tab=['drafts','saved','profile'].includes(value('tab'))?value('tab'):'published';
 const route=path.join('/');const isAuth=path[0]==='auth'&&path.length===2&&['login','signup','forgot','reset','resend'].includes(path[1]);const isNew=route==='recipes/new';const isDetail=path[0]==='recipes'&&path.length===2&&!isNew;const isEdit=path[0]==='recipes'&&path.length===3&&path[2]==='edit';const isMember=path[0]==='members'&&path.length===2;
 if(!(route===''||route==='account'||route==='moderation'||isAuth||isNew||isDetail||isEdit||isMember))notFound();
 if((isDetail||isEdit)&&!uuid.safeParse(path[1]).success)notFound();
 let viewer:Viewer|null=null;let data:PageData={};let unavailable=false;let missing=false;let denied=false;
 try{
   if(!connection())throw new Error('connection_not_configured');const client=await supabase();viewer=await getViewer(client);
   if(!isAuth){
     if(route==='')data=await explore(client,q,method,page);
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
 if(unavailable)return <Shell viewer={viewer}><section className="connection-state"><Coffee size={40} strokeWidth={1.2}/><span className="eyebrow">GOAT JOURNEY COMMUNITY</span><h1>نحضّر المساحة لتجاربكم.</h1><p>تعذّر تحميل المجتمع الآن. حاول مجددًا بعد قليل.</p><Link className="button" href="/">إعادة المحاولة</Link></section></Shell>;
 return <Shell viewer={viewer}>
 {route===''&&<><section className="hero"><div className="hero-copy"><span className="eyebrow"><i/> مجتمع الباريستا · فلسطين</span><h1>وراء كل فنجان،<br/><em>تجربة تستحق المشاركة.</em></h1><p>وصفات من دفاتر الباريستا، وتجارب من وراء البار.<br/>اكتشف، حضّر، وشاركنا طريقتك.</p><Link className="button" href="/recipes/new">شارك وصفتك<ArrowUpLeft size={20}/></Link><span className="hero-caption">المعرفة أحلى لما نتقاسمها.</span></div><div className="hero-art" aria-hidden="true"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="coffee-cup"><div className="coffee-surface"><span/></div></div><span className="art-note note-one" dir="ltr">Brew. Share. Repeat.</span><span className="art-note note-two">من تجربتك<br/>للفنجان القادم ↗</span><span className="art-spark">✳</span></div></section><section className="explore-section"><div className="section-heading"><div><span className="eyebrow">من قلب المجتمع</span><h2>ماذا سنحضّر اليوم؟</h2></div><p>{data.total||0} وصفة بانتظار تجربتك</p></div><form className="search-form" role="search"><label className="search-input"><Search size={20}/><span className="sr-only">ابحث في الوصفات</span><input name="q" defaultValue={q} maxLength={120} placeholder="ابحث عن وصفة، بن، أو نكهة…"/></label><label><span className="sr-only">طريقة التحضير</span><select name="method" defaultValue={method}><option value="">كل طرق التحضير</option>{methods.map(m=><option key={m}>{m}</option>)}</select></label><button className="button small">بحث</button>{(q||method)&&<Link className="text-link" href="/">مسح</Link>}</form><div className="filter-chips"><Link className={!method?'active':''} href={`/?${new URLSearchParams({q})}`}>الكل</Link>{methods.map(m=><Link className={method===m?'active':''} key={m} href={`/?${new URLSearchParams({q,method:m})}`}>{m}</Link>)}</div><Cards recipes={data.recipes||[]}/><Pagination page={page} more={data.hasMore} base="/" query={{q,method}}/></section><section className="community-invite"><span className="eyebrow">التجربة تبدأ منك</span><h2>وصفتك القادمة قد تلهم باريستا آخر.</h2><Link className="button secondary" href="/recipes/new">افتح دفتر وصفاتك<ArrowUpLeft size={18}/></Link></section></>}
 {(isNew||isEdit)&&<RecipeEditor key={data.recipe?`${data.recipe.id}-${data.recipe.version}`:'new'} recipe={data.recipe} categories={data.categories||[]}/>}
 {isDetail&&data.recipe&&<RecipeDetail recipe={data.recipe} comments={data.comments||[]} initialSaved={data.saved||false} viewer={viewer}/>}
 {route==='account'&&data.profile&&<><section className="profile-heading"><Avatar profile={data.profile}/><div><span className="eyebrow">دفتر تجاربك</span><h1>{data.profile.display_name}</h1><p dir="ltr">@{data.profile.username}</p></div><SignOut/></section><nav className="account-tabs" aria-label="أقسام الحساب">{[['published','وصفاتي'],['drafts','المسودات'],['saved','المحفوظات'],['profile','تعديل الملف']].map(([key,label])=><Link aria-current={tab===key?'page':undefined} className={tab===key?'active':''} key={key} href={`/account?tab=${key}`}>{label}</Link>)}</nav>{tab==='profile'?<ProfileForm profile={data.profile}/>:<>{tab==='drafts'&&<Notice>مسوداتك وصورها ظاهرة لك وحدك.</Notice>}{tab==='saved'&&<Notice>قائمتك خاصة. الوصفات المحذوفة أو المخفية لا تظهر هنا.</Notice>}<Cards recipes={data.recipes||[]}/><Pagination page={page} more={data.hasMore} base="/account" query={{tab}}/></>}</>}
 {isMember&&data.profile&&<><section className="profile-heading"><Avatar profile={data.profile}/><div><span className="eyebrow">من أهل القهوة</span><h1>{data.profile.display_name}</h1><p dir="ltr">@{data.profile.username}</p>{data.profile.city&&<p><MapPin size={16}/>{data.profile.city}{data.profile.workplace&&` · ${data.profile.workplace}`}</p>}<p className="preserve">{data.profile.bio}</p></div></section><h2>وصفات شاركها مع المجتمع</h2><Cards recipes={data.recipes||[]}/><Pagination page={page} more={data.hasMore} base={`/members/${path[1]}`} query={{}}/></>}
 {route==='moderation'&&<><div className="page-heading"><span className="eyebrow">للمشرفين</span><h1>مساحة آمنة للتجارب.</h1><p>راجع سياق البلاغ قبل اتخاذ القرار. الإجراءات تُسجّل للمراجعة.</p></div><Moderation reports={data.reports||[]}/><Pagination page={page} more={data.hasMore} base="/moderation" query={{}}/></>}
 </Shell>;
}
