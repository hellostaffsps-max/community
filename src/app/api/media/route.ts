import { supabase } from '@/lib/supabase/server';
import { imageType } from '@/lib/validation';
export async function GET(request:Request){
  const params=new URL(request.url).searchParams;const bucket=params.get('bucket');const path=params.get('path');
  if(!bucket||!['recipe-images','avatars'].includes(bucket)||!path||path.length>200||!/^[-a-zA-Z0-9_/]+\.(jpg|png|webp)$/.test(path))return new Response(null,{status:400});
  try{
    const client=await supabase();const {data,error}=await client.storage.from(bucket).download(path);
    if(error||!data)return new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});
    const bytes=new Uint8Array(await data.arrayBuffer());const type=imageType(bytes);
    if(!type)return new Response(null,{status:415});
    return new Response(bytes,{headers:{'Content-Type':type.mime,'Content-Length':String(bytes.length),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});
  }catch{return new Response(null,{status:503,headers:{'Cache-Control':'no-store'}});}
}
