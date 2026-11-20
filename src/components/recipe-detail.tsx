'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Bookmark,Flag,Clock,Thermometer,Coffee,ArrowRight,Pencil,Trash2,Droplets,Scale,ArrowDown,ArrowUpLeft,Settings2,ChevronDown,BookOpen,Quote,MessageSquare} from 'lucide-react';
import type {Recipe,Comment,Viewer} from '@/lib/types';
import {api,Avatar,Field,Notice,useAction,mediaUrl} from './shared';
import {date,number} from '@/lib/i18n';
function ReportButton({recipeId,commentId}:{recipeId?:string;commentId?:string}){const [open,setOpen]=useState(false);const action=useAction();return <div className="report-control"><button className="text-link" onClick={()=>setOpen(!open)} aria-expanded={open}><Flag size={15}/>إبلاغ</button>{open&&<form className="report-form" onSubmit={async e=>{e.preventDefault();const form=new FormData(e.currentTarget);await action.run(()=>api('/api/community/reports','POST',{...(recipeId?{recipe_id:recipeId}:{comment_id:commentId}),reason:String(form.get('reason'))}),'وصل بلاغك إلى فريق المراجعة.');}}><Field label="ما سبب البلاغ؟"><textarea name="reason" required minLength={5} maxLength={1000} rows={3}/></Field><button className="button small" disabled={action.busy}>إرسال البلاغ</button><button type="button" className="text-link" onClick={()=>setOpen(false)}>إلغاء</button>{action.message&&<Notice error={action.failed}>{action.message}</Notice>}</form>}</div>;}
function CommentItem({comment,viewer}:{comment:Comment;viewer:Viewer|null}){const action=useAction();const router=useRouter();const [editing,setEditing]=useState(false);const [deleting,setDeleting]=useState(false);return <article className="comment"><div className="comment-head"><Link className="author" href={`/members/${comment.profiles.username}`}><Avatar profile={comment.profiles}/><strong>{comment.profiles.display_name}</strong></Link><time>{date(comment.created_at)}</time></div>{editing?<form onSubmit={async e=>{e.preventDefault();const body=String(new FormData(e.currentTarget).get('body'));if(await action.run(()=>api(`/api/community/comments/${comment.id}`,'PATCH',{body}))){setEditing(false);router.refresh();}}}><Field label="تعديل تجربتك"><textarea name="body" required maxLength={2000} defaultValue={comment.body}/></Field><button className="button small" disabled={action.busy}>حفظ التعديل</button><button className="text-link" type="button" onClick={()=>setEditing(false)}>إلغاء</button></form>:<p className="preserve">{comment.body}</p>}
<div className="inline-actions">{viewer?.id===comment.author_id?<><button className="text-link" onClick={()=>setEditing(!editing)}><Pencil size={14}/>تعديل</button><button className="text-link danger" onClick={()=>setDeleting(!deleting)}><Trash2 size={14}/>حذف</button></>:viewer&&<ReportButton commentId={comment.id}/>}</div>
{deleting&&<div className="notice">حذف هذا التعليق نهائيًا؟ <button className="button danger small" disabled={action.busy} onClick={async()=>{if(await action.run(()=>api(`/api/community/comments/${comment.id}`,'DELETE')))router.refresh();}}>نعم، احذف التعليق</button><button className="text-link" onClick={()=>setDeleting(false)}>إلغاء</button></div>}{action.message&&<Notice error>{action.message}</Notice>}</article>;}
export function RecipeDetail({recipe,comments,initialSaved,viewer}:{recipe:Recipe;comments:Comment[];initialSaved:boolean;viewer:Viewer|null}){
  const action=useAction();const commentAction=useAction();const router=useRouter();
  const [saved,setSaved]=useState(initialSaved);const [deleting,setDeleting]=useState(false);
  const own=viewer?.id===recipe.owner_id;const isPublic=recipe.status==='published'&&!recipe.hidden_at;
  const metrics=[
    {label:'جرعة البن',value:recipe.dose_g,unit:'g',icon:Coffee},
    {label:'الماء',value:recipe.water_g,unit:'g',icon:Droplets},
    {label:'الناتج',value:recipe.yield_g,unit:'g',icon:Scale},
    {label:'الحرارة',value:recipe.temperature_c,unit:'°C',icon:Thermometer},
    {label:'وقت التحضير',value:recipe.time_seconds,unit:'ثانية',icon:Clock},
  ].filter(item=>item.value!=null);

  return <article className="recipe-page">
    <div className="recipe-breadcrumb"><Link className="interior-back" href="/explore"><ArrowRight size={17}/>وصفات المجتمع</Link><span>/</span><span>{recipe.method||'تجربة قهوة'}</span></div>
    {recipe.hidden_at&&<Notice>هذه الوصفة مخفية بعد المراجعة ولا تظهر للمجتمع.</Notice>}
    {recipe.status==='draft'&&<Notice>مسودة خاصة بك. لا تظهر في الاستكشاف، وصورتها خاصة أيضًا.</Notice>}
    <div className="recipe-heading-grid">
      <div className="recipe-heading-copy"><span className="recipe-method">{recipe.method||'على طريقتك'}</span><h1>{recipe.title}</h1>{recipe.description&&<p className="recipe-description preserve">{recipe.description}</p>}
        <div className="recipe-byline"><Link className="author" href={`/members/${recipe.profiles.username}`}><Avatar profile={recipe.profiles}/><span><small>وصفة وتجربة</small><strong>{recipe.profiles.display_name}</strong></span></Link><time dateTime={recipe.created_at}>{date(recipe.created_at)}</time></div>
        <div className="recipe-primary-actions">
          {viewer&&isPublic&&<button className={`button ${saved?'secondary':''}`} aria-pressed={saved} disabled={action.busy} onClick={async()=>{if(await action.run(()=>api(`/api/community/bookmarks/${recipe.id}`,saved?'DELETE':'POST')))setSaved(!saved);}}><Bookmark size={19} fill={saved?'currentColor':'none'}/>{action.busy?'جاري الحفظ…':saved?'محفوظة في دفترك':'احفظ الوصفة'}</button>}
          {!viewer&&<Link className="button" href="/auth/login"><Bookmark size={19}/>سجّل دخولك للحفظ</Link>}
          <a href="#preparation" className="quiet-link">خطوات التحضير<ArrowDown size={17}/></a>
        </div>
        <div className="recipe-secondary-actions">{own&&<details className="recipe-manage"><summary><Settings2 size={16}/>إدارة الوصفة<ChevronDown size={15}/></summary><div>{!recipe.hidden_at&&<Link href={`/recipes/${recipe.id}/edit`}><Pencil size={16}/>تعديل الوصفة</Link>}<button onClick={()=>setDeleting(!deleting)}><Trash2 size={16}/>حذف الوصفة</button></div></details>}{viewer&&!own&&isPublic&&<ReportButton recipeId={recipe.id}/>}</div>
      </div>
      {recipe.recipe_images?<figure className="recipe-photo"><img src={mediaUrl('recipe-images',recipe.recipe_images.object_path)} alt={recipe.recipe_images.alt_text||recipe.title}/><figcaption>من تجربة {recipe.profiles.display_name}</figcaption></figure>:<div className="recipe-no-photo"><span className="overline">من دفتر المجتمع</span><img src="/brand/mark-yellow.svg" alt="" width={110} height={110}/><strong>{recipe.method||'على طريقتك'}</strong><span dir="ltr">BREW. SHARE. REPEAT.</span></div>}
    </div>
    {action.message&&<Notice error={action.failed}>{action.message}</Notice>}
    {deleting&&<div className="recipe-delete-confirm"><Notice error><strong>هل تريد حذف الوصفة نهائيًا؟</strong><p>سيُحذف محتواها وتعليقاتها وحفظها. لا يمكن التراجع عن هذا الإجراء.</p><div className="inline-actions"><button className="button danger small" disabled={action.busy} onClick={async()=>{if(await action.run(()=>api(`/api/community/recipes/${recipe.id}`,'DELETE'))){router.push('/account');router.refresh();}}}>تأكيد الحذف</button><button className="button secondary small" onClick={()=>setDeleting(false)}>إلغاء</button></div></Notice></div>}
    {(metrics.length>0||recipe.grind)&&<dl className="brew-specs" aria-label="تفاصيل التحضير">{metrics.map(({label,value,unit,icon:Icon})=><div key={label}><dt><Icon size={17}/>{label}</dt><dd><bdi>{number(value!)} <span>{unit}</span></bdi></dd></div>)}{recipe.grind&&<div className="grind-spec"><dt><Settings2 size={17}/>درجة الطحن</dt><dd>{recipe.grind}</dd></div>}</dl>}
    <div className="recipe-reading-layout">
      <aside><section className="ingredient-sheet"><span className="overline">01 / على طاولة التحضير</span><h2>كل ما تحتاجه.</h2><ul>{recipe.ingredients.map((item,i)=><li key={i}><span>{item.name}</span>{item.quantity!=null||item.unit?<bdi>{item.quantity==null?'':number(item.quantity)} <span>{item.unit}</span></bdi>:<small>حسب الوصفة</small>}</li>)}</ul>{!recipe.ingredients.length&&<p className="muted">لم تُضف المكونات بعد.</p>}{(recipe.beans||recipe.roaster)&&<dl className="bean-details">{recipe.beans&&<div><dt>عن البن</dt><dd>{recipe.beans}</dd></div>}{recipe.roaster&&<div><dt>المحمصة</dt><dd>{recipe.roaster}</dd></div>}</dl>}</section><p className="recipe-side-note"><BookOpen size={17}/>اقرأ الخطوات أولًا، وجهّز أدواتك قبل البداية.</p></aside>
      <div className="recipe-reading-content">
        <section id="preparation" className="preparation-section"><span className="overline">02 / من أول خطوة، لآخر رشفة</span><h2>حضّرها على مهل.</h2><ol className="recipe-steps">{recipe.steps.map((step,i)=><li key={i}><span className="preparation-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span><div><h3>الخطوة {i+1}</h3><p className="preserve">{step.instruction}</p></div></li>)}</ol>{!recipe.steps.length&&<p className="muted">خطوات التحضير لم تُكتب بعد.</p>}</section>
        {recipe.tasting_notes&&<section className="tasting-note"><Quote size={28} strokeWidth={1.4}/><span className="overline">03 / ما وراء المقادير</span><h2>ملاحظات التذوّق.</h2><p className="preserve">{recipe.tasting_notes}</p></section>}
        <section className="recipe-discussion"><div className="discussion-heading"><div><span className="overline">الخبرة تزيد لما نشاركها</span><h2>كيف كانت تجربتك؟</h2></div><span className="discussion-count">{comments.length} تجربة</span></div><p className="discussion-intro">شارك ما جرّبته وما غيّرته. التفاصيل الصغيرة تفيد الجميع.</p>
          {viewer&&isPublic?<form className="comment-compose" onSubmit={async e=>{e.preventDefault();const element=e.currentTarget;const body=String(new FormData(element).get('body'));if(await commentAction.run(()=>api('/api/community/comments','POST',{recipe_id:recipe.id,body}))){element.reset();router.refresh();}}}><Field label="تجربتك مع الوصفة"><textarea name="body" rows={4} required maxLength={2000} placeholder="ما النتيجة؟ وهل غيّرت شيئًا في المقادير أو التحضير؟"/></Field><button className="button small" disabled={commentAction.busy}>{commentAction.busy?'جاري الإرسال…':'شارك تجربتك'}<ArrowUpLeft size={18}/></button></form>:!viewer&&<div className="discussion-signin"><MessageSquare size={24}/><p>لديك ملاحظة تضيفها؟<span>سجّل دخولك لتشارك أهل القهوة تجربتك.</span></p><Link className="button secondary small" href="/auth/login">تسجيل الدخول<ArrowUpLeft size={16}/></Link></div>}
          {commentAction.message&&<Notice error={commentAction.failed}>{commentAction.message}</Notice>}
          {!comments.length&&<p className="no-comments">لم تُشارك تجارب مع هذه الوصفة بعد.</p>}
          {comments.length===100&&<p className="muted">تظهر أحدث 100 تجربة.</p>}
          {comments.map(c=><CommentItem key={c.id} comment={c} viewer={viewer}/>)}
        </section>
      </div>
    </div>
    <div className="recipe-end-link"><span>ما زال هناك ما يستحق التجربة.</span><Link className="quiet-link" href="/explore">اكتشف وصفات المجتمع<ArrowUpLeft size={18}/></Link></div>
  </article>;
}
