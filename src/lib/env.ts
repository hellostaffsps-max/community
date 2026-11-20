import project from '../../community.config.json';

export function publicSignupEnabled() {
  return process.env.ALLOW_PUBLIC_SIGNUP === 'true' && !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
}

export function connection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const host = new URL(url).hostname;
  const local = process.env.NODE_ENV !== 'production' && ['127.0.0.1','localhost'].includes(host);
  if (!local && host !== `${project.supabaseProjectRef}.supabase.co`) throw new Error('Wrong Supabase project');
  if (!local && !key.startsWith('sb_publishable_')) throw new Error('Use a publishable key, never a secret key');
  return {url,key};
}
export function appOrigin() {
  const origin = process.env.APP_ORIGIN || 'http://localhost:3000';
  const parsed = new URL(origin);
  const local=['localhost','127.0.0.1','[::1]'].includes(parsed.hostname);
  if (parsed.origin !== origin || (parsed.protocol!=='https:' && !(local&&parsed.protocol==='http:'))) throw new Error('APP_ORIGIN must be an exact secure origin');
  return origin;
}
