import 'server-only';
import {z} from 'zod';
import {connection,publicSignupEnabled} from './env';

export const socialProviders=['google','apple'] as const;
export type SocialProvider=typeof socialProviders[number];
const publicSettingsSchema=z.object({
  disable_signup:z.literal(false),
  external:z.object({google:z.boolean().optional(),apple:z.boolean().optional()}),
});

function socialConnection(){
  const config=connection();
  if(!config)return null;
  const url=new URL(config.url);
  if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)return null;
  return {...config,origin:url.origin};
}

/** Public provider flags only. A failed probe never interrupts email authentication. */
export async function availableSocialProviders():Promise<SocialProvider[]> {
  // OAuth can create an account even from a login button; respect both signup gates.
  if(!publicSignupEnabled())return [];
  try{
    const config=socialConnection();if(!config)return [];
    const response=await fetch(config.origin+'/auth/v1/settings',{
      headers:{apikey:config.key},cache:'no-store',credentials:'omit',redirect:'error',signal:AbortSignal.timeout(5000),
    });
    if(!response.ok)return [];
    const parsed=publicSettingsSchema.safeParse(await response.json());
    if(!parsed.success)return [];
    return socialProviders.filter(provider=>parsed.data.external[provider]===true);
  }catch{return [];}
}

/** Only the same project's PKCE authorize URL may leave the OAuth start endpoint. */
export function validatedSocialAuthorizeUrl(value:unknown,provider:SocialProvider,callback:string):string|null {
  if(typeof value!=='string'||value.length>4096)return null;
  try{
    const config=socialConnection();if(!config)return null;
    const url=new URL(value);
    if(url.origin!==config.origin||url.protocol!=='https:'||url.username||url.password||url.pathname!=='/auth/v1/authorize'||url.hash)return null;
    const allowed=['provider','redirect_to','code_challenge','code_challenge_method'];
    if([...url.searchParams.keys()].some(key=>!allowed.includes(key)))return null;
    if(allowed.some(key=>url.searchParams.getAll(key).length!==1))return null;
    if(url.searchParams.get('provider')!==provider||url.searchParams.get('redirect_to')!==callback)return null;
    if(url.searchParams.get('code_challenge_method')!=='s256'||!/^[A-Za-z0-9_-]{43}$/.test(url.searchParams.get('code_challenge')||''))return null;
    return url.href;
  }catch{return null;}
}
