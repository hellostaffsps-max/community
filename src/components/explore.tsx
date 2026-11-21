import Link from 'next/link';
import {ArrowUpLeft,BookOpen,Search} from 'lucide-react';
import {Cards} from './shared';
import {StarterRecipeLibrary} from './starter-recipes';
import type {PageData,Viewer} from '@/lib/types';
import {publicSignupEnabled} from '@/lib/env';
import {authHref} from '@/lib/auth-navigation';
import {brewingTools} from '@/lib/recipe-builder';

export function Explore({data,viewer,q,method,page}:{data:PageData;viewer:Viewer|null;q:string;method:string;page:number}){
  const signupEnabled=publicSignupEnabled();
  const filtered=Boolean(q||method);
  const hasRecipes=Boolean(data.recipes?.length);
  const href=(p:number)=>'/explore?'+new URLSearchParams({q,method,page:String(p+1)});
  const createHref=viewer?'/recipes/new':authHref(signupEnabled?'signup':'login','/recipes/new');
  return <>
    <section className="explore-heading discovery-heading">
      <div><span className="overline">دفتر القهوة / اكتشف وجرّب</span><h1>ماذا سنحضّر اليوم؟</h1><p>اختر وصفتك، حضّر فنجانك، ثم أضف لمستك.</p></div>
      {viewer?<Link className="quiet-link discovery-create" href={createHref}>شارك وصفتك<ArrowUpLeft size={18}/></Link>:signupEnabled?<Link className="quiet-link discovery-create" href={createHref}>ابدأ دفترك المجاني<ArrowUpLeft size={18}/></Link>:<span className="discovery-status">التصفّح مفتوح للجميع</span>}
    </section>
    <section className="explore-section discovery-section" aria-label="تصفّح الوصفات">
      <form key={JSON.stringify([q,method])} className="search-form discovery-search" action="/explore" role="search">
        <div className="search-input"><Search size={19}/><label className="sr-only" htmlFor="recipe-search">ابحث في الوصفات</label><input id="recipe-search" name="q" defaultValue={q} maxLength={120} placeholder="ابحث عن وصفة، بن، أو نكهة…"/></div>
        <label className="discovery-method" htmlFor="recipe-method"><span className="sr-only">طريقة التحضير</span><select id="recipe-method" name="method" defaultValue={method}><option value="">كل طرق التحضير</option>{method&&!brewingTools.some(([value])=>value===method)&&<option value={method}>{method}</option>}{brewingTools.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <button className="button small">بحث</button>
        {filtered&&<Link className="text-link discovery-reset" href="/explore">مسح التصفية</Link>}
      </form>
      {hasRecipes&&<section className="community-results" aria-labelledby="community-results-title"><div className="discovery-results-heading"><h2 id="community-results-title">من دفاتر المجتمع</h2><span>{data.total} وصفة منشورة</span></div><Cards recipes={data.recipes!}/></section>}
      {(page===0||!hasRecipes)&&<StarterRecipeLibrary q={q} method={method} compact={hasRecipes}/>}
      {!hasRecipes&&<section className="community-start" aria-labelledby="community-start-title"><BookOpen size={27} strokeWidth={1.5}/><div><h2 id="community-start-title">{filtered?'تجارب الأعضاء بهذه التفاصيل لم تصل بعد.':'الفنجان التالي قد يحمل توقيعك.'}</h2><p>{filtered?'وصفات البداية مستقلة عن وصفات الأعضاء. جرّب طريقة أخرى، أو أضف تجربتك.':'وصفات البداية تساعدك على الانطلاق. شارك تجربتك لتكون من أول وصفات الأعضاء هنا.'}</p></div><Link className="quiet-link" href={createHref}>{viewer?'اكتب تجربتك':signupEnabled?'انضم وشارك':'دخول الأعضاء'}<ArrowUpLeft size={18}/></Link></section>}
      {(page>0||data.hasMore)&&<nav className="pagination" aria-label="صفحات وصفات المجتمع">{page>0&&<Link className="button secondary small" href={href(page-1)}>السابق</Link>}<span>صفحة {page+1}</span>{data.hasMore&&<Link className="button secondary small" href={href(page+1)}>التالي</Link>}</nav>}
    </section>
  </>;
}
