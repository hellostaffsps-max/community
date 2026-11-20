import Link from 'next/link';
import {ArrowUpLeft,Coffee,Search} from 'lucide-react';
import {Cards} from './shared';
import type {PageData,Viewer} from '@/lib/types';
import {publicSignupEnabled} from '@/lib/env';

const methods=['V60','Espresso','AeroPress','French Press','Cold Brew','Turkish'];

export function Explore({data,viewer,q,method,page}:{data:PageData;viewer:Viewer|null;q:string;method:string;page:number}){
  const signupEnabled=publicSignupEnabled();
  const href=(m:string,p=page)=>'/explore?'+new URLSearchParams({q,method:m,page:String(p+1)});
  return <>
    <section className="explore-heading"><div><span className="overline">دفتر المجتمع / وصفات القهوة</span><h1>ماذا سنحضّر اليوم؟</h1><p>ابحث عن طريقتك المفضلة، واقرأ تفاصيل كل تجربة. الفنجان القادم يبدأ من هنا.</p></div>{viewer?<Link className="button" href="/recipes/new">شارك وصفتك<ArrowUpLeft size={20}/></Link>:signupEnabled?<Link className="button" href="/auth/signup">انضم وشارك مجانًا<ArrowUpLeft size={20}/></Link>:<span className="discovery-status">التصفّح مفتوح · التسجيل مغلق حاليًا</span>}</section>
    <section className="explore-section" aria-label="تصفّح وصفات المجتمع">
      <form className="search-form" action="/explore" role="search"><label className="search-input"><Search size={20}/><span className="sr-only">ابحث في الوصفات</span><input name="q" defaultValue={q} maxLength={120} placeholder="ابحث عن وصفة، بن، أو نكهة…"/></label><label><span className="sr-only">طريقة التحضير</span><select name="method" defaultValue={method}><option value="">كل طرق التحضير</option>{methods.map(m=><option key={m}>{m}</option>)}</select></label><button className="button small">بحث</button>{(q||method)&&<Link className="text-link" href="/explore">مسح</Link>}</form>
      <div className="filter-chips"><Link className={!method?'active':''} aria-current={!method?'page':undefined} href={href('',0)}>الكل</Link>{methods.map(m=><Link className={method===m?'active':''} aria-current={method===m?'page':undefined} key={m} href={href(m,0)}>{m}</Link>)}</div>
      {data.recipes?.length?<><div className="results-count">{data.total} وصفة منشورة</div><Cards recipes={data.recipes}/></>:<div className="empty"><Coffee size={40} strokeWidth={1.2}/><h3>{q||method?'لم نجد وصفة بهذه التفاصيل.':'دفتر جديد، وتجارب قادمة.'}</h3><p>{q||method?'جرّب كلمة مختلفة أو استعرض كل طرق التحضير.':'لم تُنشر وصفات بعد. هنا ستجد تجارب المجتمع بمقاديرها وخطواتها وملاحظات التذوّق.'}</p>{q||method?<Link className="button secondary" href="/explore">عرض كل الوصفات</Link>:viewer?<Link className="button" href="/recipes/new">شارك أول وصفة<ArrowUpLeft size={18}/></Link>:<Link className="quiet-link" href="/#about">تعرّف على المجتمع<ArrowUpLeft size={18}/></Link>}</div>}
      {(page>0||data.hasMore)&&<nav className="pagination" aria-label="صفحات النتائج">{page>0&&<Link className="button secondary small" href={href(method,page-1)}>السابق</Link>}<span>صفحة {page+1}</span>{data.hasMore&&<Link className="button secondary small" href={href(method,page+1)}>التالي</Link>}</nav>}
    </section>
  </>;
}
