import { z } from 'zod';
import { supabase } from '@/lib/supabase/server';
import { assertOrigin,jsonBody,boundedBody,json,failure,HttpError } from '@/lib/http';
import { recipeSchema,profileSchema,commentSchema,reportSchema,uuid,imageType } from '@/lib/validation';
import { requireUser } from '@/lib/data';
import {setCommunityFollow} from '@/lib/community-social';

type Context={params:Promise<{path:string[]}>};
async function mutate(request:Request,context:Context){
  try{
    assertOrigin(request);
    const client=await supabase();const user=await requireUser(client);
    const {path}=await context.params;const [resource,id]=path;
    if(path.length>2)throw new HttpError(404,'الطلب غير موجود.');
    const method=request.method;
    if(resource==='follows'&&id&&['POST','DELETE'].includes(method)){
      uuid.parse(id);if(method==='POST')z.object({}).strict().parse(await jsonBody(request));
      return json(await setCommunityFollow(client,user.id,id,method==='POST'));
    }
    if(resource==='images'&&method==='POST'){
      const bytes=await boundedBody(request,5*1024*1024+65536);
      const form=await new Response(bytes,{headers:{'content-type':request.headers.get('content-type')||''}}).formData();
      const file=form.get('file');const kind=form.get('kind');
      if(!(file instanceof File)||!['recipe','avatar'].includes(String(kind)))throw new HttpError(400,'اختر صورة صالحة.');
      if(file.size>(kind==='avatar'?2:5)*1024*1024)throw new HttpError(413,'الصورة أكبر من الحجم المسموح.');
      const raw=new Uint8Array(await file.arrayBuffer());const type=imageType(raw);
      if(!type)throw new HttpError(415,'الصور المدعومة: JPG وPNG وWebP.');
      const bucket=kind==='recipe'?'recipe-images':'avatars';
      const recipeId=kind==='recipe'?uuid.parse(form.get('recipe_id')):null;
      let previous:string|null=null;
      if(recipeId){
        const {data}=await client.from('recipes').select('id,recipe_images(object_path)').eq('id',recipeId).eq('owner_id',user.id).is('hidden_at',null).maybeSingle();
        if(!data)throw new HttpError(403,'تعذّر تعديل صورة هذه الوصفة.');
        previous=(data.recipe_images as unknown as {object_path:string}|null)?.object_path||null;
      }else{const {data}=await client.from('profiles').select('avatar_path').eq('id',user.id).single();previous=data?.avatar_path;}
      const objectPath=`${user.id}/${recipeId?recipeId+'/':''}${crypto.randomUUID()}.${type.ext}`;
      const {error:uploadError}=await client.storage.from(bucket).upload(objectPath,raw,{contentType:type.mime,upsert:false,cacheControl:'0'});
      if(uploadError)throw uploadError;
      const result=recipeId?await client.from('recipe_images').upsert({recipe_id:recipeId,object_path:objectPath,alt_text:''}):await client.from('profiles').update({avatar_path:objectPath}).eq('id',user.id);
      if(result.error){await client.storage.from(bucket).remove([objectPath]);throw result.error;}
      if(previous){const {error}=await client.storage.from(bucket).remove([previous]);if(error)console.error(JSON.stringify({event:'media_cleanup_pending',code:'storage_cleanup'}));}
      return json({ok:true});
    }
    if(resource==='recipes'&&method==='POST'&&!id){
      const payload=recipeSchema.parse(await jsonBody(request));
      const {data,error}=await client.rpc('save_recipe',{payload});if(error)throw error;return json({id:data},payload.id?200:201);
    }
    if(resource==='recipes'&&method==='DELETE'&&id){
      uuid.parse(id);
      const {data:images}=await client.from('recipe_images').select('object_path').eq('recipe_id',id);
      const {data,error}=await client.from('recipes').delete().eq('id',id).eq('owner_id',user.id).select('id');if(error)throw error;if(!data?.length)throw new HttpError(404,'الوصفة غير متاحة للحذف.');
      if(images?.length)await client.storage.from('recipe-images').remove(images.map(i=>i.object_path));
      return json({ok:true});
    }
    if(resource==='profile'&&method==='PATCH'&&!id){
      const payload=profileSchema.parse(await jsonBody(request));const {error}=await client.from('profiles').update(payload).eq('id',user.id);if(error)throw error;return json({ok:true});
    }
    if(resource==='comments'&&method==='POST'&&!id){const payload=commentSchema.parse(await jsonBody(request));const {error}=await client.from('comments').insert({...payload,author_id:user.id});if(error)throw error;return json({ok:true},201);}
    if(resource==='comments'&&id&&['PATCH','DELETE'].includes(method)){
      uuid.parse(id);let result;
      if(method==='PATCH'){const {body}=z.object({body:z.string().trim().min(1).max(2000)}).strict().parse(await jsonBody(request));result=await client.from('comments').update({body}).eq('id',id).eq('author_id',user.id).select('id');}
      else result=await client.from('comments').delete().eq('id',id).eq('author_id',user.id).select('id');
      if(result.error)throw result.error;if(!result.data?.length)throw new HttpError(404,'التعليق غير متاح للتعديل.');return json({ok:true});
    }
    if(resource==='bookmarks'&&id&&['POST','DELETE'].includes(method)){
      uuid.parse(id);const result=method==='POST'?await client.from('bookmarks').insert({recipe_id:id,user_id:user.id}):await client.from('bookmarks').delete().eq('recipe_id',id).eq('user_id',user.id);
      if(result.error&&result.error.code!=='23505')throw result.error;return json({ok:true});
    }
    if(resource==='reports'&&method==='POST'&&!id){const payload=reportSchema.parse(await jsonBody(request));const {error}=await client.from('reports').insert({...payload,reporter_id:user.id});if(error)throw error;return json({ok:true},201);}
    if(resource==='moderation'&&id&&method==='POST'){
      uuid.parse(id);const {decision}=z.object({decision:z.enum(['dismissed','actioned'])}).strict().parse(await jsonBody(request));
      const {error}=await client.rpc('review_report',{target:id,decision});if(error)throw error;return json({ok:true});
    }
    throw new HttpError(404,'الطلب غير موجود.');
  }catch(error){return failure(error);}
}
export const POST=mutate;
export const PATCH=mutate;
export const DELETE=mutate;
