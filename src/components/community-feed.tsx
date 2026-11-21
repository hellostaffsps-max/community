import Link from 'next/link';
import {ArrowUpLeft,Clock} from 'lucide-react';
import type {Recipe,Viewer} from '@/lib/types';
import type {StarterRecipe} from '@/lib/starter-recipes';
import {number} from '@/lib/i18n';
import {Avatar} from './shared';
import {RecipeBookmark} from './recipe-bookmark';
import {RecipeShare} from './recipe-share';

type CommunityFeedProps={
  recipes:Recipe[];viewer?:Viewer|null;savedIds?:string[];showAuthor?:boolean;headingLevel?:2|3;
};
const guideImages:Record<string,string>={
  V60:'/images/guides/v60.webp','French Press':'/images/guides/french-press.webp',
  AeroPress:'/images/guides/aeropress.webp',Espresso:'/images/guides/espresso.webp',
};
function preparationTime(seconds:number){
  return seconds<60?number(seconds)+' ثانية':number(Math.round(seconds/60*10)/10)+' دقيقة';
}
export function CommunityFeed({recipes,viewer=null,savedIds=[],showAuthor=true,headingLevel=2}:CommunityFeedProps){
  if(!recipes.length)return null;
  const saved=new Set(savedIds);
  const Heading=headingLevel===3?'h3':'h2';
  return <div className="community-feed journey-recipe-grid">
    {recipes.map(recipe=>{
      const path='/recipes/'+recipe.id;
      return <article className="journey-recipe-tile" key={recipe.id} aria-labelledby={'feed-recipe-'+recipe.id}>
        <div className="journey-tile-media">
          <Link href={path} className="journey-tile-photo" aria-label={'افتح وصفة '+recipe.title}>
            {recipe.recipe_images?<img src={'/api/media?'+new URLSearchParams({bucket:'recipe-images',path:recipe.recipe_images.object_path})} alt={recipe.recipe_images.alt_text||recipe.title} width={560} height={560} loading="lazy" decoding="async"/>:<span className="journey-photo-placeholder"><img src="/brand/mark.svg" width={56} height={56} alt=""/><strong>{recipe.method||'على طريقتك'}</strong><small>لم تُضف صورة بعد</small></span>}
          </Link>
          <div className="journey-tile-save"><RecipeBookmark recipeId={recipe.id} initialSaved={saved.has(recipe.id)} signedIn={!!viewer} path={path}/></div>
        </div>
        <div className="journey-tile-caption">
          <Heading id={'feed-recipe-'+recipe.id}><Link href={path}>{recipe.title}</Link></Heading>
          {showAuthor&&<Link href={'/members/'+recipe.profiles.username} className="journey-tile-author"><Avatar profile={recipe.profiles}/><span>{recipe.profiles.display_name}</span></Link>}
          <div className="journey-tile-footer"><span className="journey-tile-method">{recipe.method||'على طريقتك'}</span><div className="journey-tile-share"><RecipeShare title={recipe.title} path={path} label="مشاركة"/></div></div>
        </div>
      </article>;
    })}
  </div>;
}
export function StarterEditorialFeed({recipes}:{recipes:StarterRecipe[]}){
  if(!recipes.length)return null;
  return <section className="starter-editorial-feed journey-guides" aria-labelledby="starter-editorial-title">
    <header className="journey-section-heading"><div><h2 id="starter-editorial-title">وصفات البداية.</h2><p>أدلة تحضير مرجعية من Goat Journey، بمصادر داخل كل دليل.</p></div></header>
    <div className="journey-recipe-grid">
      {recipes.map(recipe=><article className="journey-recipe-tile journey-guide-tile" key={recipe.slug} aria-labelledby={'feed-guide-'+recipe.slug}>
        <Link href={'/learn/'+recipe.slug} className="journey-tile-photo" aria-label={'افتح دليل '+recipe.title}><img src={guideImages[recipe.method]||'/brand/mark.svg'} alt="" width={560} height={560} loading="lazy" decoding="async"/><span className="journey-editorial-label">دليل تحضير</span></Link>
        <div className="journey-tile-caption"><h3 id={'feed-guide-'+recipe.slug}><Link href={'/learn/'+recipe.slug}>{recipe.title}</Link></h3><span className="journey-guide-author"><img src="/brand/mark.svg" width={18} height={18} alt=""/>Goat Journey</span><div className="journey-guide-meta"><span>{recipe.method}</span><span><Clock size={12}/>{preparationTime(recipe.seconds)}</span></div><Link href={'/learn/'+recipe.slug} className="journey-guide-open">طريقة التحضير<ArrowUpLeft size={15}/></Link></div>
      </article>)}
    </div>
    <p className="journey-editorial-note">صور توضيحية للأدلة. وصفات الأعضاء تحمل أسماء أصحابها وصور تجاربهم.</p>
  </section>;
}
