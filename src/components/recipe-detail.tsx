'use client';
import {useState} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {Bookmark,Flag,Clock,Thermometer,Coffee,ArrowRight,Pencil,Trash2,Droplets,Scale,ArrowDown,ArrowUpLeft,Settings2,Ellipsis,Quote,MessageSquare,MapPin} from 'lucide-react';
import type {Recipe,Comment,Viewer} from '@/lib/types';
import {api,Avatar,Field,Notice,useAction,mediaUrl} from './shared';
import {date,number} from '@/lib/i18n';
import {authHref} from '@/lib/auth-navigation';
import {RecipeShare} from './recipe-share';
import {FollowButton} from './follow-button';
function ReportButton({recipeId,commentId}:{recipeId?:string;commentId?:string}){const [open,setOpen]=useState(false);const action=useAction();return <div className="report-control"><button className="text-link" onClick={()=>setOpen(!open)} aria-expanded={open}><Flag size={15}/>إبلاغ</button>{open&&<form className="report-form" onSubmit={async e=>{e.preventDefault();const form=new FormData(e.currentTarget);await action.run(()=>api('/api/community/reports','POST',{...(recipeId?{recipe_id:recipeId}:{comment_id:commentId}),reason:String(form.get('reason'))}),'وصل بلاغك إلى فريق المراجعة.');}}><Field label="ما سبب البلاغ؟"><textarea name="reason" required minLength={5} maxLength={1000} rows={3}/></Field><button className="button small" disabled={action.busy}>إرسال البلاغ</button><button type="button" className="text-link" onClick={()=>setOpen(false)}>إلغاء</button>{action.message&&<Notice error={action.failed}>{action.message}</Notice>}</form>}</div>;}
function CommentItem({comment,viewer}:{comment:Comment;viewer:Viewer|null}){const action=useAction();const router=useRouter();const [editing,setEditing]=useState(false);const [deleting,setDeleting]=useState(false);return <article className="comment"><div className="comment-head"><Link className="author" href={`/members/${comment.profiles.username}`}><Avatar profile={comment.profiles}/><strong>{comment.profiles.display_name}</strong></Link><time>{date(comment.created_at)}</time></div>{editing?<form onSubmit={async e=>{e.preventDefault();const body=String(new FormData(e.currentTarget).get('body'));if(await action.run(()=>api(`/api/community/comments/${comment.id}`,'PATCH',{body}))){setEditing(false);router.refresh();}}}><Field label="تعديل تجربتك"><textarea name="body" required maxLength={2000} defaultValue={comment.body}/></Field><button className="button small" disabled={action.busy}>حفظ التعديل</button><button className="text-link" type="button" onClick={()=>setEditing(false)}>إلغاء</button></form>:<p className="preserve">{comment.body}</p>}
<div className="inline-actions">{viewer?.id===comment.author_id?<><button className="text-link" onClick={()=>setEditing(!editing)}><Pencil size={14}/>تعديل</button><button className="text-link danger" onClick={()=>setDeleting(!deleting)}><Trash2 size={14}/>حذف</button></>:viewer&&<ReportButton commentId={comment.id}/>}</div>
{deleting&&<div className="notice">حذف هذا التعليق نهائيًا؟ <button className="button danger small" disabled={action.busy} onClick={async()=>{if(await action.run(()=>api(`/api/community/comments/${comment.id}`,'DELETE')))router.refresh();}}>نعم، احذف التعليق</button><button className="text-link" onClick={()=>setDeleting(false)}>إلغاء</button></div>}{action.message&&<Notice error>{action.message}</Notice>}</article>;}
export function RecipeDetail({recipe,comments,initialSaved,viewer,followingEnabled=false,initialFollowing=false}:{recipe:Recipe;comments:Comment[];initialSaved:boolean;viewer:Viewer|null;followingEnabled?:boolean;initialFollowing?:boolean}){
  const action=useAction();const commentAction=useAction();const router=useRouter();
  const [saved,setSaved]=useState(initialSaved);const [deleting,setDeleting]=useState(false);
  const own=viewer?.id===recipe.owner_id;const isPublic=recipe.status==='published'&&!recipe.hidden_at;
  const recipePath=`/recipes/${recipe.id}`;
  const units:Record<string,string>={g:'غ',kg:'كغ',ml:'مل',l:'لتر',tsp:'ملعقة صغيرة',tbsp:'ملعقة كبيرة',piece:'قطعة'};
  const metrics=[
    {label:'جرعة البن',value:recipe.dose_g,unit:'g',icon:Coffee},
    {label:'الماء',value:recipe.water_g,unit:'g',icon:Droplets},
    {label:'الناتج',value:recipe.yield_g,unit:'g',icon:Scale},
    {label:'الحرارة',value:recipe.temperature_c,unit:'°C',icon:Thermometer},
    {label:'وقت التحضير',value:recipe.time_seconds,unit:'ثانية',icon:Clock},
  ].filter(item=>item.value!=null);

  return <article className="recipe-page gronda-recipe">
    <header className="recipe-focus-header">
      <Link className="recipe-focus-back" href={isPublic?'/explore':recipe.status==='draft'?'/account?tab=drafts':'/account'} aria-label={isPublic?'العودة إلى الوصفات':'العودة إلى حسابي'}><ArrowRight size={21}/></Link>
      <span className="recipe-focus-title">{recipe.title}</span>
      {own||viewer&&isPublic?<details className="recipe-focus-menu"><summary aria-label="خيارات الوصفة"><Ellipsis size={23}/></summary><div>{own?<>{!recipe.hidden_at&&<Link href={`${recipePath}/edit`}><Pencil size={17}/>تعديل الوصفة</Link>}<button type="button" onClick={event=>{event.currentTarget.closest('details')?.removeAttribute('open');setDeleting(true);requestAnimationFrame(()=>document.getElementById('recipe-delete-confirm')?.scrollIntoView({block:'center'}));}}><Trash2 size={17}/>حذف الوصفة</button></>:<ReportButton recipeId={recipe.id}/>}</div></details>:<a className="recipe-focus-jump" href="#preparation" aria-label="انتقل إلى خطوات التحضير"><ArrowDown size={20}/></a>}
    </header>
    {recipe.hidden_at&&<Notice>هذه الوصفة مخفية بعد المراجعة ولا تظهر للمجتمع.</Notice>}
    {recipe.status==='draft'&&<Notice>مسودة خاصة بك. لا تظهر في الاستكشاف، وصورتها خاصة أيضًا.</Notice>}
    <div className="recipe-hero-layout">
      {recipe.recipe_images?<figure className="recipe-hero-media"><img src={mediaUrl('recipe-images',recipe.recipe_images.object_path)} alt={recipe.recipe_images.alt_text||recipe.title} width={1000} height={800} fetchPriority="high" decoding="async"/><figcaption>من تجربة {recipe.profiles.display_name}</figcaption></figure>:<div className="recipe-hero-media recipe-hero-placeholder"><img src="/brand/mark-yellow.svg" alt="" width={88} height={88}/><strong>{recipe.method||'على طريقتك'}</strong><span>وصفة من مجتمع Goat Journey</span></div>}
      <div className="recipe-hero-copy"><span className="recipe-method">{recipe.method||'على طريقتك'}</span><h1>{recipe.title}</h1>
        <div className="recipe-creator-row"><Link className="author" href={`/members/${recipe.profiles.username}`}><Avatar profile={recipe.profiles}/><span><strong>{recipe.profiles.display_name}</strong><small>{recipe.profiles.city?<><MapPin size={12}/>{recipe.profiles.city}</>:<>صاحب الوصفة</>}</small></span></Link>{isPublic&&followingEnabled&&!own&&<FollowButton profileId={recipe.owner_id} initialFollowing={initialFollowing} signedIn={!!viewer} returnTo={recipePath} displayName={recipe.profiles.display_name}/>}</div>
        {recipe.description&&<p className="recipe-description preserve">{recipe.description}</p>}
        <div className="recipe-published-meta"><time dateTime={recipe.created_at}>{date(recipe.created_at)}</time><a href="#preparation">خطوات التحضير<ArrowDown size={15}/></a></div>
      </div>
    </div>
    {deleting&&<div id="recipe-delete-confirm" className="recipe-delete-confirm"><Notice error><strong>هل تريد حذف الوصفة نهائيًا؟</strong><p>سيُحذف محتواها وتعليقاتها وحفظها. لا يمكن التراجع عن هذا الإجراء.</p><div className="inline-actions"><button className="button danger small" disabled={action.busy} onClick={async()=>{if(await action.run(()=>api(`/api/community/recipes/${recipe.id}`,'DELETE'))){router.push('/account');router.refresh();}}}>تأكيد الحذف</button><button className="button secondary small" onClick={()=>setDeleting(false)}>إلغاء</button></div></Notice></div>}
    {(metrics.length>0||recipe.grind)&&<dl className="brew-specs" aria-label="تفاصيل التحضير">{metrics.map(({label,value,unit,icon:Icon})=><div key={label}><dt><Icon size={17}/>{label}</dt><dd><bdi>{number(value!)} <span>{unit}</span></bdi></dd></div>)}{recipe.grind&&<div className="grind-spec"><dt><Settings2 size={17}/>درجة الطحن</dt><dd>{recipe.grind}</dd></div>}</dl>}
    <div className="recipe-reading-layout">
      <aside><section className="ingredient-sheet"><div className="recipe-section-heading"><h2>المكونات</h2><span>{recipe.ingredients.length} مكوّن</span></div><ul>{recipe.ingredients.map((item,i)=><li key={i}><span>{item.name}</span>{item.quantity!=null||item.unit?<bdi>{item.quantity==null?'':number(item.quantity)} <span>{units[item.unit]||item.unit}</span></bdi>:<small>حسب الوصفة</small>}</li>)}</ul>{!recipe.ingredients.length&&<p className="muted">لم تُضف المكونات بعد.</p>}{(recipe.beans||recipe.roaster)&&<dl className="bean-details">{recipe.beans&&<div><dt>عن البن</dt><dd>{recipe.beans}</dd></div>}{recipe.roaster&&<div><dt>المحمصة</dt><dd>{recipe.roaster}</dd></div>}</dl>}</section></aside>
      <div className="recipe-reading-content">
        <section id="preparation" className="preparation-section"><div className="recipe-section-heading"><h2>طريقة التحضير</h2><span>{recipe.steps.length} خطوات</span></div><ol className="recipe-steps">{recipe.steps.map((step,i)=><li key={i}><span className="preparation-number" aria-hidden="true">{i+1}</span><div><h3>الخطوة {i+1}</h3><p className="preserve">{step.instruction}</p></div></li>)}</ol>{!recipe.steps.length&&<p className="muted">خطوات التحضير لم تُكتب بعد.</p>}</section>
        {recipe.tasting_notes&&<section className="tasting-note"><Quote size={28} strokeWidth={1.4}/><span className="overline">03 / ما وراء المقادير</span><h2>ملاحظات التذوّق.</h2><p className="preserve">{recipe.tasting_notes}</p></section>}
        {isPublic&&recipe.profiles.bio&&<section className="recipe-author-note"><Avatar profile={recipe.profiles}/><div><h3>عن {recipe.profiles.display_name}</h3><p>{recipe.profiles.bio}</p><Link className="quiet-link" href={`/members/${recipe.profiles.username}`}>كل وصفاته<ArrowUpLeft size={15}/></Link></div></section>}
        <section id="recipe-discussion" className="recipe-discussion"><div className="discussion-heading"><div><h2>التعليقات والتجارب</h2></div><span className="discussion-count">{comments.length} تجربة</span></div><p className="discussion-intro">حضّرتها؟ شارك النتيجة أو اسأل صاحب الوصفة.</p>
          {viewer&&isPublic?<form className="comment-compose" onSubmit={async e=>{e.preventDefault();const element=e.currentTarget;const body=String(new FormData(element).get('body'));if(await commentAction.run(()=>api('/api/community/comments','POST',{recipe_id:recipe.id,body}))){element.reset();router.refresh();}}}><Field label="تجربتك مع الوصفة"><textarea name="body" rows={4} required maxLength={2000} placeholder="ما النتيجة؟ وهل غيّرت شيئًا في المقادير أو التحضير؟"/></Field><button className="button small" disabled={commentAction.busy}>{commentAction.busy?'جاري الإرسال…':'شارك تجربتك'}<ArrowUpLeft size={18}/></button></form>:!viewer&&<div className="discussion-signin"><MessageSquare size={24}/><p>لديك ملاحظة تضيفها؟<span>سجّل دخولك لتشارك أهل القهوة تجربتك.</span></p><Link className="button secondary small" href={authHref('login',`${recipePath}#recipe-discussion`)}>تسجيل الدخول<ArrowUpLeft size={16}/></Link></div>}
          {commentAction.message&&<Notice error={commentAction.failed}>{commentAction.message}</Notice>}
          {!comments.length&&<p className="no-comments">لم تُشارك تجارب مع هذه الوصفة بعد.</p>}
          {comments.length===100&&<p className="muted">تظهر أحدث 100 تجربة.</p>}
          {comments.map(c=><CommentItem key={c.id} comment={c} viewer={viewer}/>)}
        </section>
      </div>
    </div>
    <div className="recipe-end-link"><span>ما زال هناك ما يستحق التجربة.</span><Link className="quiet-link" href="/explore">اكتشف وصفات المجتمع<ArrowUpLeft size={18}/></Link></div>
    <div className={`recipe-action-dock ${isPublic?'':'is-private'}`} aria-label="إجراءات الوصفة">
      {isPublic?<>
        <a className="recipe-dock-comment" href="#recipe-discussion"><MessageSquare size={21}/><span>التعليقات{comments.length>0&&<b>{comments.length}</b>}</span></a>
        <RecipeShare title={recipe.title} path={recipePath} label="مشاركة"/>
        {viewer?<button className="button recipe-dock-save" aria-pressed={saved} disabled={action.busy} onClick={async()=>{if(await action.run(()=>api(`/api/community/bookmarks/${recipe.id}`,saved?'DELETE':'POST')))setSaved(!saved);}}><Bookmark size={20} fill={saved?'currentColor':'none'}/><span>{action.busy?'جارٍ الحفظ…':saved?'محفوظة':'حفظ الوصفة'}</span></button>:<Link className="button recipe-dock-save" href={authHref('login',recipePath)} aria-label="سجّل دخولك لحفظ الوصفة"><Bookmark size={20}/><span>حفظ الوصفة</span></Link>}
      </>:<><a className="recipe-dock-comment" href="#preparation"><ArrowDown size={20}/><span>خطوات التحضير</span></a>{own&&!recipe.hidden_at&&<Link className="button recipe-dock-save" href={`${recipePath}/edit`}><Pencil size={18}/>أكمل الوصفة</Link>}</>}
      {action.message&&<p className="recipe-dock-feedback" role={action.failed?'alert':'status'}>{action.message}</p>}
    </div>
  </article>;
}
