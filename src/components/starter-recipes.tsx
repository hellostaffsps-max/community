import Link from 'next/link';
import {ArrowUpLeft,ArrowRight,ArrowDown,BookOpen,Clock,Coffee,Droplets,Scale,Thermometer,ExternalLink,Plus} from 'lucide-react';
import {findStarterRecipes,type StarterRecipe} from '@/lib/starter-recipes';
import {RecipeShare} from './recipe-share';
import {authHref} from '@/lib/auth-navigation';
import {publicSignupEnabled} from '@/lib/env';

const guideImages:Record<string,string>={'v60-first-cup':'/images/guides/v60.webp','french-press-basics':'/images/guides/french-press.webp','aeropress-upright':'/images/guides/aeropress.webp'};

export function StarterRecipeLibrary({q='',method='',compact=false}:{q?:string;method?:string;compact?:boolean}){
  const recipes=findStarterRecipes(q,method);if(!recipes.length)return null;
  return <section className={`starter-library gronda-starter-library ${compact?'is-compact':''}`} aria-labelledby="starter-title">
    <div className="starter-heading"><div><span className="eyebrow"><BookOpen size={15}/>ابدأ بفنجان، ثم أضف لمستك</span><h2 id="starter-title">وصفات البداية.</h2></div><p>أدلة مرجعية بمصادر واضحة. حضّر واحدة، وعدّلها في دفترك لتصبح تجربتك.</p></div>
    <div className="starter-grid">{recipes.map((recipe,index)=><Link className={`starter-card starter-${recipe.tone}`} key={recipe.slug} href={`/learn/${recipe.slug}`}>{guideImages[recipe.slug]&&<img className="starter-card-image" src={guideImages[recipe.slug]} alt={`صورة توضيحية لتحضير ${recipe.method}`} width={600} height={450} loading="lazy"/>}<div className="starter-card-top"><span>دليل تحضير</span><bdi>{String(index+1).padStart(2,'0')}</bdi></div><div className="starter-method" dir="ltr">{recipe.method}</div><h3>{recipe.title}</h3><p>{recipe.description}</p><div className="starter-card-meta"><span><Scale size={15}/><bdi>{recipe.dose} g</bdi></span><span><Clock size={15}/>{Math.round(recipe.seconds/60)} دقائق تقريبًا</span><ArrowUpLeft size={21}/></div></Link>)}</div>
    <p className="starter-disclosure">هذه أدلة البداية، وتظهر تجارب الأعضاء في قسم وصفات المجتمع.</p>
  </section>;
}

export function StarterRecipeDetail({recipe,signedIn}:{recipe:StarterRecipe;signedIn:boolean}){
  const next=`/recipes/new?template=${recipe.slug}`;
  const createHref=signedIn?next:authHref(publicSignupEnabled()?'signup':'login',next);
  return <article className="starter-detail gronda-guide gronda-recipe">
    <header className="recipe-focus-header"><Link className="recipe-focus-back" href="/explore" aria-label="العودة إلى الوصفات"><ArrowRight size={21}/></Link><span className="recipe-focus-title">{recipe.title}</span><a className="recipe-focus-jump" href="#starter-preparation" aria-label="انتقل إلى خطوات التحضير"><ArrowDown size={20}/></a></header>
    <div className="recipe-hero-layout">
      {guideImages[recipe.slug]&&<figure className="recipe-hero-media"><img src={guideImages[recipe.slug]} alt={`صورة توضيحية لتحضير القهوة باستخدام ${recipe.method}`} width={1000} height={800} fetchPriority="high" decoding="async"/><figcaption>صورة توضيحية للدليل</figcaption></figure>}
      <header className="recipe-hero-copy"><span className="recipe-method">{recipe.method}</span><h1>{recipe.title}</h1><div className="guide-creator-row"><img src="/brand/mark.svg" width={42} height={42} alt=""/><span><strong>Goat Journey</strong><small>من أدلة البداية · بمصدر واضح</small></span></div><p className="recipe-description">{recipe.description}</p><a className="guide-start-link" href="#starter-preparation">ابدأ التحضير<ArrowDown size={17}/></a></header>
    </div>
    <dl className="brew-specs" aria-label="مقادير دليل التحضير"><div><dt><Coffee size={17}/>البن</dt><dd><bdi>{recipe.dose} g</bdi></dd></div><div><dt><Droplets size={17}/>الماء</dt><dd>{recipe.water==null?recipe.waterLabel:<bdi>{recipe.water} g</bdi>}</dd></div><div><dt><Thermometer size={17}/>الحرارة المرجعية</dt><dd><bdi>{recipe.temperature} °C</bdi></dd></div><div><dt><Clock size={17}/>الوقت التقريبي</dt><dd>{Math.round(recipe.seconds/60)} دقائق</dd></div></dl>
    <div className="recipe-reading-layout"><aside><section className="ingredient-sheet"><div className="recipe-section-heading"><h2>الأدوات</h2><span>قبل التحضير</span></div><ul>{recipe.equipment.map(item=><li key={item}>{item}</li>)}</ul><dl className="bean-details"><div><dt>درجة الطحن</dt><dd>{recipe.grind}</dd></div></dl></section><p className="recipe-side-note">الوقت والطحنة نقطة بداية؛ النتيجة تتغيّر مع البن والأداة.</p></aside>
      <div className="recipe-reading-content"><section id="starter-preparation" className="preparation-section"><div className="recipe-section-heading"><h2>حضّرها على مهل.</h2><span>{recipe.steps.length} خطوات</span></div><ol className="recipe-steps">{recipe.steps.map((instruction,index)=><li key={index}><span className="preparation-number" aria-hidden="true">{index+1}</span><div><h3>الخطوة {index+1}</h3><p>{instruction}</p></div></li>)}</ol></section><aside className="starter-note"><strong>مساحة لتجربتك</strong><p>{recipe.note}</p></aside><p className="starter-source">تلخيص عربي مرجعي، مستند إلى <a href={recipe.source.url} target="_blank" rel="noreferrer">{recipe.source.name}<ExternalLink size={14}/></a>.</p></div>
    </div>
    <section className="starter-next"><div><span className="eyebrow">الآن، دور تجربتك</span><h2>خذ الوصفة إلى دفترك.</h2><p>ابدأ بالمقادير والخطوات جاهزة، وعدّلها وأضف ملاحظتك وصورتك. أنت تختار وقت الحفظ أو النشر.</p></div></section>
    <div className="recipe-action-dock guide-action-dock" aria-label="إجراءات دليل التحضير"><RecipeShare title={recipe.title} path={`/learn/${recipe.slug}`} label="مشاركة"/><Link href={createHref} className="button recipe-dock-save" aria-label={signedIn?'جرّبها في دفترك':publicSignupEnabled()?'أنشئ حسابًا مجانيًا وجرّبها':'سجّل دخولك وجرّبها'}><Plus size={20}/>{signedIn?'جرّبها في دفترك':'ابدأ تجربتك مجانًا'}</Link></div>
  </article>;
}
