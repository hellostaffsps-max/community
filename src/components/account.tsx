'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {ArrowUpLeft,Camera,Check,LogOut,ShieldCheck} from 'lucide-react';
import {api,Avatar,Field,Notice,useAction} from './shared';
import type {Profile} from '@/lib/types';
import {accountNeedsSetup,hasDefaultDisplayName,hasGeneratedUsername} from '@/lib/member-onboarding';

export function ProfileForm({profile}:{profile:Profile}){
  const action=useAction();const router=useRouter();const needsSetup=accountNeedsSetup(profile);const [bio,setBio]=useState(profile.bio);const [avatarName,setAvatarName]=useState('');
  return <form className="journey-settings" onSubmit={async e=>{
    e.preventDefault();const form=new FormData(e.currentTarget);const data=Object.fromEntries(['username','display_name','bio','city','workplace','country_code'].map(k=>[k,String(form.get(k)||'')]));
    const result=await action.run(async()=>{await api('/api/community/profile','PATCH',data);const file=form.get('avatar');if(file instanceof File&&file.size){const upload=new FormData();upload.set('kind','avatar');upload.set('file',file);await api('/api/community/images','POST',upload);}return true;},'تم حفظ ملفك.');if(result)router.refresh();
  }}>
    <header className="journey-settings-heading"><h2>تعديل الملف</h2><p>التفاصيل التي يعرفك بها أهل القهوة.</p></header>
    <p className="journey-profile-private"><ShieldCheck size={14}/>تفاصيل الملف عامة. بريدك الإلكتروني يبقى خاصًا.</p>
    {needsSetup&&<div className="journey-settings-intro"><strong>ابدأ باسمك.</strong><p>اختر اسم العرض واسم مستخدم لرابط ملفك. لن يتغيّر شيء حتى تضغط «حفظ التغييرات».</p></div>}
    <fieldset disabled={action.busy}>
      <section className="journey-settings-section" aria-labelledby="journey-settings-identity">
        <h3 id="journey-settings-identity">الصورة والاسم</h3>
        <div className="journey-settings-photo"><Avatar profile={profile}/><div><Field label="صورة شخصية" hint="JPG أو PNG أو WebP، حتى 2 MB."><span className="journey-photo-picker"><Camera size={17}/><span>تغيير الصورة</span><input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setAvatarName(e.target.files?.[0]?.name||'')}/></span><span className="journey-photo-filename">{avatarName||'لم تُختر صورة جديدة'}</span></Field></div></div>
        <div className="journey-settings-grid">
          <Field label="اسم العرض"><input name="display_name" required maxLength={60} defaultValue={hasDefaultDisplayName(profile.display_name)?'':profile.display_name} placeholder="اسمك في المجتمع" autoComplete="nickname"/></Field>
          <Field label="اسم المستخدم" hint="3–30 حرفًا إنجليزيًا صغيرًا أو رقمًا أو _."><input name="username" dir="ltr" required pattern="[a-z0-9_]{3,30}" maxLength={30} defaultValue={hasGeneratedUsername(profile.username)?'':profile.username} placeholder="your_coffee_name" autoComplete="username"/></Field>
        </div>
        <Field label="نبذة عنك (اختياري)"><textarea name="bio" rows={3} maxLength={500} value={bio} onChange={e=>setBio(e.target.value)} placeholder="كيف تحب أن تحضّر قهوتك؟"/></Field><span className="journey-settings-counter" dir="ltr">{bio.length} / 500</span>
      </section>
      <section className="journey-settings-section" aria-labelledby="journey-settings-location">
        <h3 id="journey-settings-location">المكان</h3>
        <div className="journey-settings-grid">
          <Field label="المدينة (اختياري)"><input name="city" maxLength={80} defaultValue={profile.city} autoComplete="address-level2"/></Field>
          <Field label="الدولة"><select name="country_code" defaultValue={profile.country_code} autoComplete="country">{[['PS','فلسطين'],['JO','الأردن'],['LB','لبنان'],['EG','مصر'],['SA','السعودية'],['AE','الإمارات']].map(([code,name])=><option key={code} value={code}>{name}</option>)}{!['PS','JO','LB','EG','SA','AE'].includes(profile.country_code)&&<option>{profile.country_code}</option>}</select></Field>
        </div>
        <Field label="مكان العمل (اختياري)"><input name="workplace" maxLength={120} defaultValue={profile.workplace} autoComplete="organization" placeholder="المقهى أو المحمصة أو مساحتك الخاصة"/></Field>
      </section>
      <div className="journey-settings-save"><button className="button"><Check size={17}/>{action.busy?'جاري الحفظ…':'حفظ التغييرات'}</button>{!hasGeneratedUsername(profile.username)&&<Link href={'/members/'+profile.username}>عرض الملف العام<ArrowUpLeft size={15}/></Link>}</div>
    </fieldset>
    {action.message&&<Notice error={action.failed}>{action.message}</Notice>}
  </form>;
}

export function SignOut(){const action=useAction();const router=useRouter();return <><button className="account-signout" disabled={action.busy} onClick={async()=>{if(await action.run(()=>api('/api/auth/logout'))){router.push('/');router.refresh();}}}><LogOut size={17}/>{action.busy?'جاري الخروج…':'تسجيل الخروج'}</button>{action.message&&<Notice error>{action.message}</Notice>}</>;}
