import { z } from 'zod';
import { appOrigin } from './env';
export class HttpError extends Error { constructor(public status:number,message:string){super(message);} }
export function assertOrigin(req:Request) {
  const origin=req.headers.get('origin');
  const allowed=[appOrigin()];
  if(process.env.NODE_ENV!=='production')allowed.push('http://localhost:3000','http://127.0.0.1:3000');
  if(!origin||!allowed.includes(origin)) throw new HttpError(403,'مصدر الطلب غير مسموح.');
}
export async function boundedBody(req:Request,limit=65536) {
  if(Number(req.headers.get('content-length'))>limit) throw new HttpError(413,'حجم الطلب أكبر من المسموح.');
  const reader=req.body?.getReader(); if(!reader)return new Uint8Array();
  const chunks:Uint8Array[]=[];let total=0;
  while(true){const {done,value}=await reader.read();if(done)break;total+=value.length;if(total>limit){await reader.cancel();throw new HttpError(413,'حجم الطلب أكبر من المسموح.');}chunks.push(value);}
  const bytes=new Uint8Array(total);let pos=0;for(const chunk of chunks){bytes.set(chunk,pos);pos+=chunk.length;}return bytes;
}
export async function jsonBody(req:Request){
  if(!req.headers.get('content-type')?.includes('application/json'))throw new HttpError(415,'صيغة الطلب غير مدعومة.');
  try{return JSON.parse(new TextDecoder().decode(await boundedBody(req)));}catch(e){if(e instanceof HttpError)throw e;throw new HttpError(400,'طلب غير صالح.');}
}
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});}
export function failure(error:unknown){
  if(error instanceof HttpError)return json({error:error.message},error.status);
  if(error instanceof z.ZodError)return json({error:'راجع الحقول المدخلة.',fields:error.issues.map(i=>({path:i.path.join('.'),message:i.message}))},400);
  const e=error as {code?:string;message?:string};
  if(e?.message?.includes('rate_limit'))return json({error:'وصلت إلى الحد المؤقت. حاول لاحقًا.'},429);
  if(e?.code==='23505')return json({error:'هذه القيمة مستخدمة مسبقًا.'},409);
  if(e?.code==='40001')return json({error:'تغيّرت الوصفة أو تعذّر تعديلها. أعد تحميل الصفحة.'},409);
  if(e?.code==='42501')return json({error:'لا تملك صلاحية تنفيذ هذا الطلب.'},403);
  const requestId=crypto.randomUUID();
  console.error(JSON.stringify({event:'request_failed',requestId,code:e?.code||'unknown'}));
  return json({error:'تعذّر إكمال الطلب. حاول مجددًا.',requestId},503);
}
