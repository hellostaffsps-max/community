import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Recipe,Profile,Comment,Report,Viewer } from './types';
import { HttpError } from './http';
export const recipeSelect='*, profiles!recipes_owner_id_fkey(id,username,display_name,city,avatar_path), recipe_images(object_path,alt_text)';
export async function viewer(client:SupabaseClient):Promise<Viewer|null>{
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user)return null;
  const {data}=await client.from('user_roles').select('role').eq('user_id',user.id).maybeSingle();
  return {id:user.id,email:user.email,moderator:data?.role==='admin'||data?.role==='moderator'};
}
export async function requireUser(client:SupabaseClient){
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user)throw new HttpError(401,'سجّل دخولك للمتابعة.');
  if(!user.email_confirmed_at)throw new HttpError(403,'تحقق من بريدك أولًا.');
  return user;
}
export async function explore(client:SupabaseClient,query:string,method:string,page:number,owner?:string){
  let request=client.from('recipes').select(recipeSelect,{count:'exact'}).eq('status','published').is('hidden_at',null).order('created_at',{ascending:false}).order('id').range(page*12,page*12+11);
  if(query.trim())request=request.textSearch('search_document',query.slice(0,120),{type:'websearch',config:'simple'});
  if(method)request=request.eq('method',method);
  if(owner)request=request.eq('owner_id',owner);
  const {data,error,count}=await request.returns<Recipe[]>();if(error)throw error;
  return {recipes:data||[],hasMore:(count||0)>(page+1)*12,total:count||0};
}
export async function detail(client:SupabaseClient,id:string,userId?:string){
  const {data,error}=await client.from('recipes').select(`${recipeSelect},recipe_ingredients(name,quantity,unit,position),recipe_steps(instruction,position)`).eq('id',id).maybeSingle();
  if(error)throw error;if(!data)throw new HttpError(404,'الوصفة غير متاحة.');
  const recipe={...data,ingredients:data.recipe_ingredients.sort((a:{position:number},b:{position:number})=>a.position-b.position),steps:data.recipe_steps.sort((a:{position:number},b:{position:number})=>a.position-b.position)} as Recipe;
  const {data:comments,error:commentError}=await client.from('comments').select('*,profiles!comments_author_id_fkey(id,display_name,username,avatar_path)').eq('recipe_id',id).is('hidden_at',null).order('created_at',{ascending:false}).limit(100).returns<Comment[]>();
  if(commentError)throw commentError;
  let saved=false;if(userId){const {data:bookmark}=await client.from('bookmarks').select('recipe_id').eq('recipe_id',id).eq('user_id',userId).maybeSingle();saved=!!bookmark;}
  return {recipe,comments:comments||[],saved};
}
export async function account(client:SupabaseClient,id:string,tab:string,page:number){
  const {data:profile,error}=await client.from('profiles').select('*').eq('id',id).single<Profile>();if(error)throw error;
  if(tab==='saved'){
    const {data,error,count}=await client.from('bookmarks').select(`recipe_id,recipes!inner(${recipeSelect})`,{count:'exact'}).eq('user_id',id).eq('recipes.status','published').is('recipes.hidden_at',null).order('created_at',{ascending:false}).range(page*12,page*12+11);
    if(error)throw error;
    return {profile,recipes:(data||[]).map(row=>row.recipes as unknown as Recipe),hasMore:(count||0)>(page+1)*12};
  }
  const {data,error:err,count}=await client.from('recipes').select(recipeSelect,{count:'exact'}).eq('owner_id',id).eq('status',tab==='drafts'?'draft':'published').order('created_at',{ascending:false}).range(page*12,page*12+11).returns<Recipe[]>();
  if(err)throw err;return {profile,recipes:data||[],hasMore:(count||0)>(page+1)*12};
}
export async function reports(client:SupabaseClient,page:number){
  const {data,error,count}=await client.from('reports').select('*,recipes(title),comments(body,recipe_id)',{count:'exact'}).eq('status','pending').order('created_at').range(page*20,page*20+19).returns<Report[]>();
  if(error)throw error;return {reports:data||[],hasMore:(count||0)>(page+1)*20};
}
