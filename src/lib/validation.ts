import { z } from 'zod';
const short=(max:number)=>z.string().trim().max(max).default('');
const metric=(max:number,min=0)=>z.number().finite().min(min).max(max).nullable().optional();
export const uuid=z.uuid();
export const recipeSchema=z.object({
  id:uuid.optional(),version:z.number().int().positive().optional(),
  title:z.string().trim().min(2).max(120),description:short(3000),category_id:z.string().regex(/^[a-z][a-z0-9-]{1,39}$/),
  method:short(80),beans:short(150),roaster:short(120),tasting_notes:short(1000),grind:short(120),
  dose_g:metric(1000,0.01),water_g:metric(20000,0.01),yield_g:metric(20000,0.01),temperature_c:metric(100),
  time_seconds:z.number().int().min(1).max(172800).nullable().optional(),status:z.enum(['draft','published']),
  ingredients:z.array(z.object({name:z.string().trim().min(1).max(100),quantity:metric(100000,0.01),unit:short(30)})).max(30),
  steps:z.array(z.object({instruction:z.string().trim().min(1).max(2000)})).max(30)
}).strict().superRefine((r,ctx)=>{
  if(r.id&&!r.version)ctx.addIssue({code:'custom',message:'أعد تحميل الوصفة قبل تعديلها',path:['version']});
  if(r.status==='published'&&(!r.ingredients.length||!r.steps.length))ctx.addIssue({code:'custom',message:'أضف مكوّنًا وخطوة تحضير على الأقل قبل النشر',path:['steps']});
});
export type RecipeInput=z.infer<typeof recipeSchema>;
export const profileSchema=z.object({username:z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,30}$/),display_name:z.string().trim().min(1).max(60),bio:short(500),city:short(80),workplace:short(120),country_code:z.string().regex(/^[A-Z]{2}$/).default('PS')}).strict();
export const commentSchema=z.object({recipe_id:uuid,body:z.string().trim().min(1).max(2000)}).strict();
export const reportSchema=z.object({recipe_id:uuid.optional(),comment_id:uuid.optional(),reason:z.string().trim().min(5).max(1000)}).strict().refine(r=>Boolean(r.recipe_id)!==Boolean(r.comment_id),'اختر محتوى واحدًا للإبلاغ');
export const authSchema=z.object({email:z.email().max(254),password:z.string().min(12).max(128),captchaToken:z.string().max(4096).optional()}).strict();
export const emailSchema=authSchema.omit({password:true});
export function imageType(bytes:Uint8Array) {
  if(bytes.length<12) return null;
  if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff) return {mime:'image/jpeg',ext:'jpg'};
  if([137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b)) return {mime:'image/png',ext:'png'};
  if(String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP') return {mime:'image/webp',ext:'webp'};
  return null;
}
