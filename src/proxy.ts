import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { connection } from '@/lib/env';
import { privateFetch } from '@/lib/supabase/fetch';

export async function proxy(request: NextRequest) {
  let response=NextResponse.next({request});
  const config=connection();
  if(config) {
    const client=createServerClient(config.url,config.key,{global:{fetch:privateFetch},cookies:{
      getAll:()=>request.cookies.getAll(),
      setAll(values){
        for(const {name,value} of values) request.cookies.set(name,value);
        response=NextResponse.next({request});
        for(const {name,value,options} of values) response.cookies.set(name,value,options);
      }
    }});
    // getUser contacts Auth; a user-controlled cookie is never authorization.
    await client.auth.getUser();
  }
  response.headers.set('Cache-Control','private, no-store');
  return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
