'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {Bookmark,BookmarkCheck} from 'lucide-react';
import {api} from './shared';
import {authHref} from '@/lib/auth-navigation';

export function RecipeBookmark({recipeId,initialSaved,signedIn,path}:{recipeId:string;initialSaved:boolean;signedIn:boolean;path?:string}){
  const [saved,setSaved]=useState(initialSaved);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
  useEffect(()=>{setSaved(initialSaved);setMessage('');},[initialSaved,recipeId]);
  async function toggle(){
    if(busy)return;setBusy(true);setMessage('');
    try{await api(`/api/community/bookmarks/${recipeId}`,saved?'DELETE':'POST');setSaved(!saved);setMessage(saved?'أُزيلت من محفوظاتك':'حُفظت في دفترك');}
    catch(error){setMessage(error instanceof Error?error.message:'تعذّر حفظ الوصفة. حاول مجددًا.');}
    finally{setBusy(false);}
  }
  if(!signedIn)return <Link className="bookmark-button" href={authHref('login',path||`/recipes/${recipeId}`)}><Bookmark size={18}/><span>احفظ لوقت لاحق</span></Link>;
  return <span className={`recipe-bookmark ${saved?'is-saved':''}`}><button type="button" className="bookmark-button" aria-pressed={saved} disabled={busy} onClick={()=>void toggle()}>{saved?<BookmarkCheck size={18}/>:<Bookmark size={18}/>}<span>{busy?'لحظة…':saved?'محفوظة':'احفظ لوقت لاحق'}</span></button><small className="bookmark-message" role="status">{message}</small></span>;
}
