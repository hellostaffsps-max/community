import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import {uuid} from './validation';
import {HttpError} from './http';

export const MAX_FOLLOWING=200;
export type CommunitySocialState={available:boolean;followedIds:string[];followingCount:number};
type DatabaseError={code?:string;message?:string};
export function isFollowCapabilityMissing(error:DatabaseError|null|undefined){return !!error&&['42P01','PGRST205','PGRST204'].includes(error.code||'');}
const unavailable=():CommunitySocialState=>({available:false,followedIds:[],followingCount:0});

export async function getCommunitySocial(client:SupabaseClient,viewerId?:string|null):Promise<CommunitySocialState>{
  if(!viewerId){
    // GET with limit zero preserves PostgREST error codes for a missing table;
    // HEAD error responses can discard that body and hide capability failures.
    const {error}=await client.from('member_follows').select('followed_id').limit(0);
    if(isFollowCapabilityMissing(error))return unavailable();
    if(error)throw error;
    return {available:true,followedIds:[],followingCount:0};
  }
  uuid.parse(viewerId);
  const {data,error,count}=await client.from('member_follows').select('followed_id',{count:'exact'}).eq('follower_id',viewerId).order('followed_id').range(0,MAX_FOLLOWING-1).returns<{followed_id:string}[]>();
  if(isFollowCapabilityMissing(error))return unavailable();
  if(error)throw error;
  const followedIds=(data||[]).map(row=>row.followed_id);
  if((count!=null&&count!==followedIds.length)||followedIds.length>MAX_FOLLOWING)throw new HttpError(503,'تعذّر تحميل المتابعة كاملة. أعد المحاولة.');
  return {available:true,followedIds,followingCount:followedIds.length};
}

/** Call with the authenticated ID returned by requireUser, never a request-body ID. */
export async function setCommunityFollow(client:SupabaseClient,viewerId:string,targetId:string,following:boolean){
  uuid.parse(viewerId);uuid.parse(targetId);
  if(viewerId===targetId)throw new HttpError(400,'لا يمكنك متابعة حسابك نفسه.');
  if(following){
    const {data,error}=await client.from('profiles').select('id').eq('id',targetId).maybeSingle();
    if(error)throw error;if(!data)throw new HttpError(404,'هذا العضو غير متاح.');
  }
  const result=following
    ?await client.from('member_follows').upsert({follower_id:viewerId,followed_id:targetId},{onConflict:'follower_id,followed_id',ignoreDuplicates:true})
    :await client.from('member_follows').delete().eq('follower_id',viewerId).eq('followed_id',targetId);
  if(isFollowCapabilityMissing(result.error))throw new HttpError(503,'المتابعة لم تُجهّز بعد. جرّب لاحقًا.');
  if(result.error?.message?.includes('follow_limit_reached'))throw new HttpError(409,'وصلت إلى 200 متابعة. ألغِ متابعة أحد الحسابات لإضافة حساب آخر.');
  if(result.error?.code==='23503')throw new HttpError(404,'هذا العضو غير متاح.');
  if(result.error)throw result.error;
  return {following};
}
