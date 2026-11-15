import { readFile } from 'node:fs/promises';
const config = JSON.parse(await readFile(new URL('../community.config.json',import.meta.url),'utf8'));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (url !== `https://${config.supabaseProjectRef}.supabase.co` || !key?.startsWith('sb_publishable_')) {
  throw new Error('Missing publishable connection details for the allowed community project.');
}
const settings=await fetch(url+'/auth/v1/settings',{headers:{apikey:key},signal:AbortSignal.timeout(15000)});
if(settings.ok){const data=await settings.json();console.log(`direct_signup_disabled: ${data.disable_signup===true}`);}else process.exitCode=1;
for (const [name,path] of [['auth','/auth/v1/health'], ['schema','/rest/v1/recipes?select=id&limit=0']]) {
  const result=await fetch(url+path,{headers:{apikey:key},signal:AbortSignal.timeout(15000)});
  console.log(`${name}: HTTP ${result.status}`);
  if (!result.ok) process.exitCode=1;
}
