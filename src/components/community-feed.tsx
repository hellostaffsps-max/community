import Link from 'next/link';
import {ArrowUpLeft,BookOpen,Clock,Scale} from 'lucide-react';
import type {Recipe,Viewer} from '@/lib/types';
import type {StarterRecipe} from '@/lib/starter-recipes';
import {date,number} from '@/lib/i18n';
import {Avatar} from './shared';
import {RecipeBookmark} from './recipe-bookmark';
import {RecipeShare} from './recipe-share';

type CommunityFeedProps={
  recipes:Recipe[];
  viewer?:Viewer|null;
  savedIds?:string[];
  showAuthor?:boolean;
  headingLevel?:2|3;
};

function preparationTime(seconds:number){
  return seconds<60?number(seconds)+' ثانية':number(Math.round(seconds/60*10)/10)+' دقيقة';
}

export function CommunityFeed({recipes,viewer=null,savedIds=[],showAuthor=true,headingLevel=2}:CommunityFeedProps){
  if(!recipes.length)return null;
  const saved=new Set(savedIds);
  const Heading=headingLevel===3?'h3':'h2';
  return <div className="community-feed">
    {recipes.map(recipe=>{
      const path='/recipes/'+recipe.id;
      return <article className="feed-article" key={recipe.id} aria-labelledby={'feed-recipe-'+recipe.id}>
        <header className="feed-byline">
          {showAuthor?<Link href={'/members/'+recipe.profiles.username} className="feed-author"><Avatar profile={recipe.profiles}/><span><strong>{recipe.profiles.display_name}</strong>{recipe.profiles.city&&<small>{recipe.profiles.city}</small>}</span></Link>:<span className="feed-entry-label">من دفتر التجارب</span>}
          <time dateTime={recipe.created_at}>{date(recipe.created_at)}</time>
        </header>
        <div className={'feed-article-body '+(recipe.recipe_images?'has-photo':'')}>
          <div className="feed-article-copy">
            <Heading id={'feed-recipe-'+recipe.id}><Link href={path}>{recipe.title}</Link></Heading>
            <p>{recipe.description||recipe.tasting_notes||'المقادير، الخطوات، والتفاصيل التي صنعت هذه التجربة.'}</p>
            <div className="feed-brew-meta" aria-label="تفاصيل سريعة للوصفة">
              <span className="feed-method">{recipe.method||'على طريقتك'}</span>
              {recipe.time_seconds!=null&&recipe.time_seconds>0&&<span><Clock size={14}/>{preparationTime(recipe.time_seconds)}</span>}
              {recipe.dose_g!=null&&recipe.dose_g>0&&<span><Scale size={14}/><bdi>{number(recipe.dose_g)} g</bdi></span>}
            </div>
          </div>
          {recipe.recipe_images&&<Link href={path} className="feed-photo" aria-label={'صورة وصفة '+recipe.title}><img src={'/api/media?'+new URLSearchParams({bucket:'recipe-images',path:recipe.recipe_images.object_path})} alt={recipe.recipe_images.alt_text||recipe.title} width={160} height={160} loading="lazy" decoding="async"/></Link>}
        </div>
        <footer className="feed-article-actions">
          <Link className="feed-read-link" href={path} aria-label={'اقرأ وصفة '+recipe.title}>اقرأ الوصفة<ArrowUpLeft size={17}/></Link>
          <div className="feed-reader-actions"><RecipeBookmark recipeId={recipe.id} initialSaved={saved.has(recipe.id)} signedIn={!!viewer} path={path}/><RecipeShare title={recipe.title} path={path}/></div>
        </footer>
      </article>;
    })}
  </div>;
}

export function StarterEditorialFeed({recipes}:{recipes:StarterRecipe[]}){
  if(!recipes.length)return null;
  return <section className="starter-editorial-feed" aria-labelledby="starter-editorial-title">
    <div className="feed-section-heading"><div><span className="feed-kicker"><BookOpen size={14}/>قراءات لبداية الرحلة</span><h2 id="starter-editorial-title">وصفات البداية.</h2></div><p>أدلة مرجعية بمصادر واضحة، لتبدأ منها تجربتك.</p></div>
    {recipes.map(recipe=><article className="feed-article feed-reference" key={recipe.slug} aria-labelledby={'feed-guide-'+recipe.slug}>
      <header className="feed-byline"><span className="feed-editorial-author"><span className="feed-editorial-mark"><img src="/brand/mark.svg" width={22} height={22} alt=""/></span><span><strong>Goat Journey</strong><small>دليل تحضير مرجعي</small></span></span><span className="feed-reference-label">من أدلة البداية</span></header>
      <h3 id={'feed-guide-'+recipe.slug}><Link href={'/learn/'+recipe.slug}>{recipe.title}</Link></h3>
      <p className="feed-reference-description">{recipe.description}</p>
      <div className="feed-brew-meta" aria-label="تفاصيل دليل التحضير"><span className="feed-method">{recipe.method}</span><span><Clock size={14}/>{preparationTime(recipe.seconds)} تقريبًا</span><span><Scale size={14}/><bdi>{number(recipe.dose)} g</bdi></span></div>
      <footer className="feed-article-actions"><Link href={'/learn/'+recipe.slug} className="feed-read-link">اقرأ طريقة التحضير<ArrowUpLeft size={17}/></Link><span className="feed-source-label">بمصدر واضح داخل الدليل</span></footer>
    </article>)}
    <p className="feed-editorial-note">أدلة البداية مستقلة عن وصفات الأعضاء. شارك ما غيّرته وما تعلّمته لتصبح الوصفة تجربتك.</p>
  </section>;
}
