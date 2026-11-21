import Link from 'next/link';
import {ArrowUpLeft,ArrowRight,BookOpen,Clock,Coffee,Droplets,Scale,Thermometer,ExternalLink} from 'lucide-react';
import {findStarterRecipes,type StarterRecipe} from '@/lib/starter-recipes';
import {RecipeShare} from './recipe-share';
import {authHref} from '@/lib/auth-navigation';
import {publicSignupEnabled} from '@/lib/env';

export function StarterRecipeLibrary({q='',method='',compact=false}:{q?:string;method?:string;compact?:boolean}){
  const recipes=findStarterRecipes(q,method);if(!recipes.length)return null;
  return <section className={`starter-library ${compact?'is-compact':''}`} aria-labelledby="starter-title">
    <div className="starter-heading"><div><span className="eyebrow"><BookOpen size={15}/>ابدأ بفنجان، ثم أضف لمستك</span><h2 id="starter-title">وصفات البداية.</h2></div><p>أدلة مرجعية بمصادر واضحة. حضّر واحدة، وعدّلها في دفترك لتصبح تجربتك.</p></div>
    <div className="starter-grid">{recipes.map((recipe,index)=><Link className={`starter-card starter-${recipe.tone}`} key={recipe.slug} href={`/learn/${recipe.slug}`}><div className="starter-card-top"><span>دليل تحضير</span><bdi>{String(index+1).padStart(2,'0')}</bdi></div><div className="starter-method" dir="ltr">{recipe.method}</div><h3>{recipe.title}</h3><p>{recipe.description}</p><div className="starter-card-meta"><span><Scale size={15}/><bdi>{recipe.dose} g</bdi></span><span><Clock size={15}/>{Math.round(recipe.seconds/60)} دقائق تقريبًا</span><ArrowUpLeft size={21}/></div></Link>)}</div>
    <p className="starter-disclosure">هذه أدلة البداية، وتظهر تجارب الأعضاء في قسم وصفات المجتمع.</p>
  </section>;
}

export function StarterRecipeDetail({recipe,signedIn}:{recipe:StarterRecipe;signedIn:boolean}){
  const next=`/recipes/new?template=${recipe.slug}`;
  const createHref=signedIn?next:authHref(publicSignupEnabled()?'signup':'login',next);
  return <article className="starter-detail">
    <Link href="/explore" className="interior-back"><ArrowRight size={17}/>العودة إلى الوصفات</Link>
    <header className={`starter-detail-hero starter-${recipe.tone}`}><span className="starter-label"><BookOpen size={17}/>من أدلة البداية</span><div className="starter-method" dir="ltr">{recipe.method}</div><h1>{recipe.title}</h1><p>{recipe.description}</p><div className="starter-detail-actions"><a className="button" href="#starter-preparation">ابدأ التحضير<ArrowUpLeft size={17}/></a><RecipeShare title={recipe.title} path={`/learn/${recipe.slug}`}/></div></header>
    <dl className="brew-specs" aria-label="مقادير دليل التحضير"><div><dt><Coffee size={17}/>البن</dt><dd><bdi>{recipe.dose} g</bdi></dd></div><div><dt><Droplets size={17}/>الماء</dt><dd>{recipe.water==null?recipe.waterLabel:<bdi>{recipe.water} g</bdi>}</dd></div><div><dt><Thermometer size={17}/>الحرارة المرجعية</dt><dd><bdi>{recipe.temperature} °C</bdi></dd></div><div><dt><Clock size={17}/>الوقت التقريبي</dt><dd>{Math.round(recipe.seconds/60)} دقائق</dd></div></dl>
    <div className="recipe-reading-layout"><aside><section className="ingredient-sheet"><span className="overline">جهّز طاولتك</span><h2>الأدوات.</h2><ul>{recipe.equipment.map(item=><li key={item}>{item}</li>)}</ul><dl className="bean-details"><div><dt>درجة الطحن</dt><dd>{recipe.grind}</dd></div></dl></section><p className="recipe-side-note">الوقت والطحنة نقطة بداية؛ النتيجة تتغيّر مع البن والأداة.</p></aside>
      <div className="recipe-reading-content"><section id="starter-preparation" className="preparation-section"><span className="overline">من أول خطوة، لآخر رشفة</span><h2>حضّرها على مهل.</h2><ol className="recipe-steps">{recipe.steps.map((instruction,index)=><li key={index}><span className="preparation-number" aria-hidden="true">{String(index+1).padStart(2,'0')}</span><div><h3>الخطوة {index+1}</h3><p>{instruction}</p></div></li>)}</ol></section><aside className="starter-note"><strong>مساحة لتجربتك</strong><p>{recipe.note}</p></aside><p className="starter-source">تلخيص عربي مرجعي، مستند إلى <a href={recipe.source.url} target="_blank" rel="noreferrer">{recipe.source.name}<ExternalLink size={14}/></a>.</p></div>
    </div>
    <section className="starter-next"><div><span className="eyebrow">الآن، دور تجربتك</span><h2>خذ الوصفة إلى دفترك.</h2><p>ابدأ بالمقادير والخطوات جاهزة، وعدّلها وأضف ملاحظتك وصورتك. أنت تختار وقت الحفظ أو النشر.</p></div><Link href={createHref} className="button">{signedIn?'جرّبها في دفترك':publicSignupEnabled()?'أنشئ حسابًا وجرّبها':'سجّل دخولك وجرّبها'}<ArrowUpLeft size={18}/></Link></section>
  </article>;
}
