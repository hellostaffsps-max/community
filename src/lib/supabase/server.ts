import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { connection } from '@/lib/env';
import { privateFetch } from './fetch';

export async function supabase() {
  const config=connection();
  if (!config) throw new Error('connection_not_configured');
  const jar=await cookies();
  return createServerClient(config.url,config.key,{
    global:{fetch:privateFetch},
    cookies:{
      getAll(){return jar.getAll();},
      setAll(values){
        try { for(const {name,value,options} of values) jar.set(name,value,options); }
        catch { /* Read-only Server Component: proxy refreshes cookies. */ }
      }
    }
  });
}
