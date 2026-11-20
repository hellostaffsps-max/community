'use client';
import {useState,type ReactNode} from 'react';
import Link from 'next/link';
import {Coffee,ArrowUpLeft,MapPin} from 'lucide-react';
import type {Recipe,Profile} from '@/lib/types';
import {date,number} from '@/lib/i18n';

export async function api<T=Record<string,unknown>>(path:string,method='POST',body?:unknown):Promise<T>{
  const form=body instanceof FormData;
  const result=await fetch(path,{method,headers:body&&!form?{'Content-Type':'application/json'}:undefined,body:form?body:body?JSON.stringify(body):undefined});
  const data=await result.json() as T & {error?:string};if(!result.ok)throw new Error(data.error||'تعذّر إكمال الطلب.');return data;
}
export function useAction(){
  const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [failed,setFailed]=useState(false);
  async function run<T>(fn:()=>Promise<T>,success=''){setBusy(true);setMessage('');setFailed(false);try{const result=await fn();setMessage(success);return result;}catch(e){setMessage(e instanceof Error?e.message:'حدث خطأ. حاول مجددًا.');setFailed(true);return null;}finally{setBusy(false);}}
  return {busy,message,failed,run,setMessage};
}
export function Notice({children,error=false}:{children:ReactNode;error?:boolean}){return <div className={`notice ${error?'notice-error':''}`} role={error?'alert':'status'}>{children}</div>;}
export function Field({label,hint,children}:{label:string;hint?:string;children:ReactNode}){return <label className="field"><span>{label}</span>{children}{hint&&<small>{hint}</small>}</label>;}
export function mediaUrl(bucket:string,path:string){return `/api/media?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`;}
export function Avatar({profile}:{profile:Pick<Profile,'avatar_path'|'display_name'>}){return profile.avatar_path?<img className="avatar" src={mediaUrl('avatars',profile.avatar_path)} alt=""/>:<span className="avatar avatar-placeholder" aria-hidden="true">{profile.display_name.charAt(0)}</span>;}
export function RecipeCard({recipe}:{recipe:Recipe}){return <article className="recipe-card">
  <Link href={`/recipes/${recipe.id}`} className="recipe-cover" aria-label={`وصفة ${recipe.title}`}>
    {recipe.recipe_images?<img src={mediaUrl('recipe-images',recipe.recipe_images.object_path)} alt={recipe.recipe_images.alt_text||recipe.title} loading="lazy"/>:<div className="cover-placeholder"><Coffee size={48} strokeWidth={1}/><span>{recipe.method||'على طريقتك'}</span></div>}
    <span className="cover-tag">{recipe.hidden_at?'مخفية للمراجعة':recipe.status==='draft'?'مسودة خاصة':recipe.method||'قهوة'}</span>
    <span className="cover-arrow"><ArrowUpLeft size={19}/></span>
  </Link>
  <div className="card-content"><div className="card-meta"><span>{recipe.dose_g?`${number(recipe.dose_g)} g`:'وصفة مجتمع'}</span><span>{date(recipe.created_at)}</span></div>
  <h3><Link href={`/recipes/${recipe.id}`}>{recipe.title}</Link></h3><p>{recipe.description||recipe.tasting_notes||'اكتشف المكونات وخطوات التحضير.'}</p>
  <Link href={`/members/${recipe.profiles.username}`} className="author"><Avatar profile={recipe.profiles}/><span>{recipe.profiles.display_name}{recipe.profiles.city&&<small><MapPin size={12}/>{recipe.profiles.city}</small>}</span></Link></div>
  </article>;}
export function Cards({recipes}:{recipes:Recipe[]}){return recipes.length?<div className="recipe-grid">{recipes.map(r=><RecipeCard key={r.id} recipe={r}/>)}</div>:<div className="empty"><Coffee size={38} strokeWidth={1.2}/><h3>تجارب قادمة، وحكايات جديدة.</h3><p>لا توجد وصفات منشورة هنا بعد. اكتشف تجارب أخرى من المجتمع.</p><Link className="button secondary" href="/explore">استكشف الوصفات<ArrowUpLeft size={18}/></Link></div>;}
