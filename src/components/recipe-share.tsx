'use client';
import {useState} from 'react';
import {Share2,Check,Copy} from 'lucide-react';
export function RecipeShare({title,path}:{title:string;path:string}){
  const [message,setMessage]=useState('');const [manual,setManual]=useState('');
  async function share(){
    const url=new URL(path,window.location.origin).href;
    try{
      if(navigator.share){await navigator.share({title,url});return;}
      await navigator.clipboard.writeText(url);setMessage('نُسخ رابط الوصفة');
    }catch(error){if((error as {name?:string}).name==='AbortError')return;setManual(url);setMessage('انسخ الرابط وشاركه مع أهل القهوة.');}
  }
  return <div className="recipe-share"><button className="button secondary small" type="button" onClick={()=>void share()}>{message&&!manual?<Check size={17}/>:<Share2 size={17}/>}مشاركة الوصفة</button><span role="status">{message}</span>{manual&&<label><Copy size={16}/><span className="sr-only">رابط الوصفة للمشاركة</span><input value={manual} readOnly dir="ltr" onFocus={event=>event.currentTarget.select()}/></label>}</div>;
}
