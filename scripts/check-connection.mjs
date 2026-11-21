import { readFile } from 'node:fs/promises';
const config = JSON.parse(await readFile(new URL('../community.config.json',import.meta.url),'utf8'));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const expectOpen=process.argv.includes('--expect-signup=open');
const expectGoogle=process.argv.includes('--expect-google=enabled');
if (url !== `https://${config.supabaseProjectRef}.supabase.co` || !key?.startsWith('sb_publishable_')) {
  throw new Error('Missing publishable connection details for the allowed community project.');
}
const settings=await fetch(url+'/auth/v1/settings',{headers:{apikey:key},signal:AbortSignal.timeout(15000)});
if (settings.ok) {
  const data = await settings.json();
  const closed = data.disable_signup === true;
  const googleDisabled = data.external?.google === false;
  const appleDisabled = data.external?.apple === false;
  const googleMatches = expectGoogle ? data.external?.google === true : googleDisabled;
  const appClosed = process.env.ALLOW_PUBLIC_SIGNUP !== 'true';
  console.log(`direct_signup_disabled: ${closed}`);
  console.log(`google_signin_disabled: ${googleDisabled}`);
  console.log(`apple_signin_disabled: ${appleDisabled}`);
  console.log(`expected_google: ${expectGoogle?'enabled':'disabled'}`);
  console.log(`app_signup_disabled: ${appClosed}`);
  console.log(`expected_signup: ${expectOpen?'open':'closed'}`);
  if (closed===expectOpen || !googleMatches || !appleDisabled || appClosed===expectOpen || (expectOpen&&!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)) process.exitCode = 1;
} else {
  console.log(`auth_settings: HTTP ${settings.status}`);
  process.exitCode = 1;
}
for (const [name,path] of [['auth','/auth/v1/health'], ['schema','/rest/v1/recipes?select=id&limit=0']]) {
  const result=await fetch(url+path,{headers:{apikey:key},signal:AbortSignal.timeout(15000)});
  console.log(`${name}: HTTP ${result.status}`);
  if (!result.ok) process.exitCode=1;
}
