'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {UserCheck,UserPlus} from 'lucide-react';
import {authHref} from '@/lib/auth-navigation';
import {api,Notice,useAction} from './shared';

export type FollowButtonProps={profileId:string;initialFollowing:boolean;signedIn:boolean;returnTo:string;displayName?:string;className?:string};
// Parent renders this only after the server confirms follow capability exists.
export function FollowButton({profileId,initialFollowing,signedIn,returnTo,displayName,className=''}:FollowButtonProps){
  const router=useRouter();const action=useAction();const inFlight=useRef(false);const [following,setFollowing]=useState(initialFollowing);
  useEffect(()=>setFollowing(initialFollowing),[initialFollowing,profileId]);
  if(!signedIn)return <Link className={`button small ${className}`} href={authHref('login',returnTo)}><UserPlus size={17}/>ادخل للمتابعة</Link>;
  return <div className="follow-control"><button type="button" className={`button small ${following?'secondary':''} ${className}`} aria-pressed={following} aria-label={`${following?'إلغاء متابعة':'متابعة'} ${displayName||'هذا العضو'}`} disabled={action.busy} onClick={async()=>{
    if(inFlight.current)return;inFlight.current=true;
    try{
      const result=await action.run(()=>api<{following:boolean}>(`/api/community/follows/${encodeURIComponent(profileId)}`,following?'DELETE':'POST',following?undefined:{}));
      if(result){setFollowing(result.following);action.setMessage(result.following?'ستجد وصفاته المنشورة في صفحة المتابعة.':'أُلغيت المتابعة.');router.refresh();}
    }finally{inFlight.current=false;}
  }}>{following?<UserCheck size={17}/>:<UserPlus size={17}/>}<span>{action.busy?'جاري الحفظ…':following?'تتابعه':'متابعة'}</span></button>{action.message&&<Notice error={action.failed}>{action.message}</Notice>}</div>;
}
