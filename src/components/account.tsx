'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {ArrowUpLeft,Camera,Check,LogOut,Settings2,ShieldCheck} from 'lucide-react';
import {api,Avatar,Field,Notice,useAction} from './shared';
import type {Profile} from '@/lib/types';

export function ProfileForm({profile}:{profile:Profile}){
  const action=useAction();const router=useRouter();const [bio,setBio]=useState(profile.bio);const [avatarName,setAvatarName]=useState('');
  return <form className="profile-form" onSubmit={async e=>{
    e.preventDefault();const form=new FormData(e.currentTarget);const data=Object.fromEntries(['username','display_name','bio','city','workplace','country_code'].map(k=>[k,String(form.get(k)||'')]));
    const result=await action.run(async()=>{await api('/api/community/profile','PATCH',data);const file=form.get('avatar');if(file instanceof File&&file.size){const upload=new FormData();upload.set('kind','avatar');upload.set('file',file);await api('/api/community/images','POST',upload);}return true;},'تم حفظ ملفك.');if(result)router.refresh();
  }}>
    <div className="account-content-heading"><span className="section-icon"><Settings2 size={22}/></span><div><h2>ملفك، بطريقتك.</h2><p>عرّف أهل القهوة بالشخص وراء الوصفات.</p></div></div>
    <div className="privacy-caption"><ShieldCheck size={16}/>هذه التفاصيل عامة. بريدك الإلكتروني يبقى خاصًا.</div>
    <fieldset disabled={action.busy}>
      <section className="profile-form-section"><div className="form-block-title"><span dir="ltr">01</span><h3>الصورة والاسم</h3></div>
        <div className="profile-photo-field"><Avatar profile={profile}/><div><Field label="صورة شخصية" hint="JPG أو PNG أو WebP، حتى 2 MB."><span className="file-control"><Camera size={18}/><span>اختر صورة</span><input name="avatar" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>setAvatarName(e.target.files?.[0]?.name||'')}/></span><span className="file-name">{avatarName||'لم تُختر صورة جديدة'}</span></Field></div></div>
        <div className="form-grid"><Field label="اسم العرض"><input name="display_name" required maxLength={60} defaultValue={profile.display_name} autoComplete="nickname"/></Field><Field label="اسم المستخدم" hint="3–30 حرفًا إنجليزيًا صغيرًا أو رقمًا أو _. يجب أن يكون فريدًا."><input name="username" dir="ltr" required pattern="[a-z0-9_]{3,30}" maxLength={30} defaultValue={profile.username} autoComplete="username"/></Field></div>
      </section>
      <section className="profile-form-section"><div className="form-block-title"><span dir="ltr">02</span><h3>من أين تحضّر قهوتك؟</h3></div><div className="form-grid">
        <Field label="المدينة"><input name="city" maxLength={80} defaultValue={profile.city} autoComplete="address-level2"/></Field>
        <Field label="الدولة"><select name="country_code" defaultValue={profile.country_code} autoComplete="country">{[['PS','فلسطين'],['JO','الأردن'],['LB','لبنان'],['EG','مصر'],['SA','السعودية'],['AE','الإمارات']].map(([code,name])=><option key={code} value={code}>{name}</option>)}{!['PS','JO','LB','EG','SA','AE'].includes(profile.country_code)&&<option>{profile.country_code}</option>}</select></Field>
      </div><Field label="مكان العمل (اختياري)"><input name="workplace" maxLength={120} defaultValue={profile.workplace} autoComplete="organization" placeholder="المقهى، المحمصة، أو مساحتك الخاصة"/></Field></section>
      <section className="profile-form-section"><div className="form-block-title"><span dir="ltr">03</span><h3>القهوة، على طريقتك</h3></div><Field label="نبذة عنك"><textarea name="bio" rows={4} maxLength={500} value={bio} onChange={e=>setBio(e.target.value)} placeholder="كيف بدأت رحلتك مع القهوة؟ وماذا تحب أن تحضّر؟"/></Field><span className="field-counter" dir="ltr">{bio.length} / 500</span></section>
      <div className="profile-save-row"><button className="button"><Check size={18}/>{action.busy?'جاري الحفظ…':'حفظ التغييرات'}</button><Link className="quiet-link" href={`/members/${profile.username}`}>عرض الملف العام<ArrowUpLeft size={17}/></Link></div>
    </fieldset>
    {action.message&&<Notice error={action.failed}>{action.message}</Notice>}
  </form>;
}

export function SignOut(){const action=useAction();const router=useRouter();return <><button className="account-signout" disabled={action.busy} onClick={async()=>{if(await action.run(()=>api('/api/auth/logout'))){router.push('/');router.refresh();}}}><LogOut size={17}/>{action.busy?'جاري الخروج…':'تسجيل الخروج'}</button>{action.message&&<Notice error>{action.message}</Notice>}</>;}
