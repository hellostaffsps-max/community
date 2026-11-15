'use client';
import {useRouter} from 'next/navigation';
import {api,Avatar,Field,Notice,useAction} from './shared';
import type {Profile} from '@/lib/types';
export function ProfileForm({profile}:{profile:Profile}){
  const action=useAction();const router=useRouter();
  return <form className="form-section" onSubmit={async e=>{e.preventDefault();const form=new FormData(e.currentTarget);const data=Object.fromEntries(['username','display_name','bio','city','workplace','country_code'].map(k=>[k,String(form.get(k)||'')]));const result=await action.run(async()=>{await api('/api/community/profile','PATCH',data);const file=form.get('avatar');if(file instanceof File&&file.size){const upload=new FormData();upload.set('kind','avatar');upload.set('file',file);await api('/api/community/images','POST',upload);}return true;},'تم حفظ ملفك.');if(result)router.refresh();}}>
  <h2>ملفك، بطريقتك.</h2><p className="muted">هذه التفاصيل تظهر للمجتمع. بريدك الإلكتروني يبقى خاصًا.</p><Avatar profile={profile}/>
  <fieldset disabled={action.busy}><div className="form-grid">
  <Field label="اسم العرض"><input name="display_name" required maxLength={60} defaultValue={profile.display_name}/></Field>
  <Field label="اسم المستخدم" hint="3–30 حرفًا إنجليزيًا صغيرًا أو رقمًا أو _. يجب أن يكون فريدًا."><input name="username" dir="ltr" required pattern="[a-z0-9_]{3,30}" defaultValue={profile.username}/></Field>
  <Field label="المدينة"><input name="city" maxLength={80} defaultValue={profile.city}/></Field>
  <Field label="مكان العمل (اختياري)"><input name="workplace" maxLength={120} defaultValue={profile.workplace}/></Field>
  <Field label="الدولة"><select name="country_code" defaultValue={profile.country_code}>{[['PS','فلسطين'],['JO','الأردن'],['LB','لبنان'],['EG','مصر'],['SA','السعودية'],['AE','الإمارات']].map(([code,name])=><option key={code} value={code}>{name}</option>)}{!['PS','JO','LB','EG','SA','AE'].includes(profile.country_code)&&<option>{profile.country_code}</option>}</select></Field>
  <Field label="صورة شخصية (اختياري)" hint="JPG أو PNG أو WebP، حتى 2 MB."><input name="avatar" type="file" accept="image/jpeg,image/png,image/webp"/></Field></div>
  <Field label="نبذة عنك"><textarea name="bio" rows={4} maxLength={500} defaultValue={profile.bio}/></Field>
  <button className="button">{action.busy?'جاري الحفظ…':'حفظ التغييرات'}</button></fieldset>{action.message&&<Notice error={action.failed}>{action.message}</Notice>}</form>;
}
export function SignOut(){const action=useAction();const router=useRouter();return <><button className="text-link" disabled={action.busy} onClick={async()=>{if(await action.run(()=>api('/api/auth/logout'))){router.push('/');router.refresh();}}}>تسجيل الخروج</button>{action.message&&<Notice error>{action.message}</Notice>}</>;}
