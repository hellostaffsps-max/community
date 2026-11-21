import {z} from 'zod';
import type {EditorValues,EditorIngredient,EditorStep} from './recipe-builder';

export const RECIPE_DRAFT_TTL=14*24*60*60*1000;
export type DraftScope={ownerId:string;recipeId:string|null;templateKey?:string|null};
export type DraftStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export type RecipeDraftSnapshot={writerId:string;values:EditorValues;ingredients:EditorIngredient[];steps:EditorStep[];stage:number;baseVersion:number|null;legacyMetricsAccepted:boolean};
const text=z.string().max(3000);
const valuesSchema=z.object({title:text,description:text,category_id:text,method:text,beans:text,roaster:text,grind:text,dose_g:text,water_g:text,yield_g:text,temperature_c:text,minutes:text,seconds:text,tasting_notes:text});
// An allowlist deliberately strips File objects, tokens and unrelated fields.
const draftSchema=z.object({schema:z.literal(1),writerId:z.string().min(1).max(200).default('legacy'),ownerId:z.string().min(1).max(200),recipeId:z.string().min(1).max(200).nullable(),templateKey:z.string().min(1).max(200).nullable().default(null),savedAt:z.number().finite(),baseVersion:z.number().int().positive().nullable(),stage:z.number().int().min(0).max(3),legacyMetricsAccepted:z.boolean(),values:valuesSchema,ingredients:z.array(z.object({key:z.string().max(100),name:z.string().max(100),quantity:z.string().max(100),unit:z.string().max(30)})).max(30),steps:z.array(z.object({key:z.string().max(100),instruction:z.string().max(2000)})).max(30)});
export type RecipeDraft=z.infer<typeof draftSchema>;
export function recipeDraftKey(scope:DraftScope){return `community:recipe-draft:v1:${encodeURIComponent(scope.ownerId)}:${scope.recipeId?`recipe:${encodeURIComponent(scope.recipeId)}`:scope.templateKey?`new:template:${encodeURIComponent(scope.templateKey)}`:'new:blank'}`;}
export function serializeRecipeDraft(scope:DraftScope,snapshot:RecipeDraftSnapshot,now=Date.now()){
  if(!scope.ownerId)return null;
  const parsed=draftSchema.safeParse({...snapshot,...scope,templateKey:scope.templateKey||null,schema:1,savedAt:now});
  return parsed.success?JSON.stringify(parsed.data):null;
}
export function parseRecipeDraft(raw:string|null,scope:DraftScope,now=Date.now()):RecipeDraft|null{
  if(!raw||raw.length>200_000||!scope.ownerId)return null;
  try{
    const parsed=draftSchema.safeParse(JSON.parse(raw));if(!parsed.success)return null;
    const draft=parsed.data;
    return draft.ownerId===scope.ownerId&&draft.recipeId===scope.recipeId&&draft.templateKey===(scope.templateKey||null)&&draft.savedAt<=now+300_000&&now-draft.savedAt<=RECIPE_DRAFT_TTL?draft:null;
  }catch{return null;}
}
export function readRecipeDraft(storage:DraftStorage,scope:DraftScope,now=Date.now()){
  try{return {draft:parseRecipeDraft(storage.getItem(recipeDraftKey(scope)),scope,now),unavailable:false};}catch{return {draft:null,unavailable:true};}
}
export function writeRecipeDraft(storage:DraftStorage,scope:DraftScope,snapshot:RecipeDraftSnapshot,now=Date.now()){
  const raw=serializeRecipeDraft(scope,snapshot,now);if(!raw)return false;
  try{storage.setItem(recipeDraftKey(scope),raw);return true;}catch{return false;}
}
export function removeRecipeDraft(storage:DraftStorage,scope:DraftScope){
  try{storage.removeItem(recipeDraftKey(scope));return true;}catch{return false;}
}
export function sameRecipeDraftSnapshot(left:RecipeDraftSnapshot,right:RecipeDraftSnapshot){
  const scope={ownerId:'snapshot-comparison',recipeId:null};const normalized=serializeRecipeDraft(scope,left,0);
  return normalized!==null&&normalized===serializeRecipeDraft(scope,right,0);
}
// A delayed save from a previous editor must never erase a newer draft in
// this recipe slot. Writer identity also separates equal-content new tabs.
export function removeSavedRecipeDraft(storage:DraftStorage,scope:DraftScope,saved:RecipeDraftSnapshot,now=Date.now()){
  try{
    const current=parseRecipeDraft(storage.getItem(recipeDraftKey(scope)),scope,now);
    if(!current||!sameRecipeDraftSnapshot(current,saved))return {removed:false,unavailable:false};
    storage.removeItem(recipeDraftKey(scope));return {removed:true,unavailable:false};
  }catch{return {removed:false,unavailable:true};}
}
