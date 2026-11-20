import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {normalizeEmailCode} from '../src/lib/email-code';

const {auth}=vi.hoisted(()=>({auth:{signUp:vi.fn(),verifyOtp:vi.fn(),resend:vi.fn(),signOut:vi.fn(),signInWithPassword:vi.fn(),resetPasswordForEmail:vi.fn(),updateUser:vi.fn()}}));
vi.mock('@/lib/supabase/server',()=>({supabase:async()=>({auth})}));
vi.mock('@/lib/data',()=>({requireUser:vi.fn()}));
import {POST} from '../src/app/api/auth/[action]/route';

function request(action:string,body:unknown,origin='https://goatlab.my') {
  return POST(new Request(`https://goatlab.my/api/auth/${action}`,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)}),{params:Promise.resolve({action})});
}
const signup={email:'member@example.com',password:'a long unique phrase',captchaToken:'test-captcha'};
beforeEach(()=>{
  vi.resetAllMocks();
  vi.stubEnv('APP_ORIGIN','https://goatlab.my');
  vi.stubEnv('ALLOW_PUBLIC_SIGNUP','true');
  vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY','test-site-key');
  auth.signOut.mockResolvedValue({error:null});
});
afterEach(()=>vi.unstubAllEnvs());

describe('email confirmation code',()=>{
  it('preserves leading zeroes and accepts both Arabic digit sets',()=>{
    expect(normalizeEmailCode(' ٠١٢٣٤٥ ')).toBe('012345');
    expect(normalizeEmailCode('۰۱۲۳۴۵')).toBe('012345');
    expect(normalizeEmailCode('012345')).toBe('012345');
  });
  it('rejects partial, overlong and non-digit codes without numeric coercion',()=>{
    for(const value of [123456,'12345','1234567','12 345','12e345',null])expect(normalizeEmailCode(value)).toBeNull();
  });
});

describe('free registration boundaries',()=>{
  it('rejects cross-origin verification before reaching Auth',async()=>{
    expect((await request('verify',{email:signup.email,token:'012345'},'https://foreign.invalid')).status).toBe(403);
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });
  it('keeps the rollout closed unless signup and CAPTCHA are configured',async()=>{
    vi.stubEnv('ALLOW_PUBLIC_SIGNUP','false');
    expect((await request('signup',signup)).status).toBe(503);
    vi.stubEnv('ALLOW_PUBLIC_SIGNUP','true');vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY','');
    expect((await request('signup',signup)).status).toBe(503);
    expect(auth.signUp).not.toHaveBeenCalled();
  });
  it('requires CAPTCHA before registration and resend',async()=>{
    expect((await request('signup',{...signup,captchaToken:''})).status).toBe(400);
    expect((await request('resend',{email:signup.email})).status).toBe(400);
    expect(auth.signUp).not.toHaveBeenCalled();expect(auth.resend).not.toHaveBeenCalled();
  });
  it('creates an unconfirmed account and advances to verification without billing or session data',async()=>{
    auth.signUp.mockResolvedValue({data:{session:null,user:{id:'new-member'}},error:null});
    const response=await request('signup',signup);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({confirmation:true,message:expect.any(String)});
    expect(auth.signUp).toHaveBeenCalledWith({email:signup.email,password:signup.password,options:{emailRedirectTo:'https://goatlab.my/auth/callback',captchaToken:'test-captcha'}});
  });
  it('does not silently accept a misconfigured auto-confirmed signup',async()=>{
    auth.signUp.mockResolvedValue({data:{session:{access_token:'never-expose'}},error:null});
    expect((await request('signup',signup)).status).toBe(503);
    expect(auth.signOut).toHaveBeenCalledWith({scope:'local'});
  });
  it('rejects malformed verification codes before provider calls',async()=>{
    expect((await request('verify',{email:signup.email,token:'123'})).status).toBe(400);
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });
  it('verifies normalized email OTP and returns only a fixed account destination',async()=>{
    auth.verifyOtp.mockResolvedValue({data:{session:{access_token:'never-expose'},user:{email_confirmed_at:'2026-11-20'}},error:null});
    const response=await request('verify',{email:signup.email,token:'٠١٢٣٤٥'});
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ok:true,next:'/account'});
    expect(auth.verifyOtp).toHaveBeenCalledWith({email:signup.email,token:'012345',type:'email'});
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
  it('rejects an absent or unconfirmed session',async()=>{
    auth.verifyOtp.mockResolvedValueOnce({data:{session:null,user:{email_confirmed_at:'2026-11-20'}},error:null});
    expect((await request('verify',{email:signup.email,token:'012345'})).status).toBe(400);
    auth.verifyOtp.mockResolvedValueOnce({data:{session:{},user:{email_confirmed_at:null}},error:null});
    expect((await request('verify',{email:signup.email,token:'012345'})).status).toBe(400);
    expect(auth.signOut).toHaveBeenCalledWith({scope:'local'});
  });
  it('maps expired codes and throttling without exposing provider payloads',async()=>{
    auth.verifyOtp.mockResolvedValueOnce({data:{},error:{status:403,message:'internal payload'}});
    const invalid=await request('verify',{email:signup.email,token:'012345'});
    expect(invalid.status).toBe(400);expect(await invalid.text()).not.toContain('internal payload');
    auth.verifyOtp.mockResolvedValueOnce({data:{},error:{status:429}});
    expect((await request('verify',{email:signup.email,token:'012345'})).status).toBe(429);
  });
  it('resends signup codes with CAPTCHA and keeps unknown email responses generic',async()=>{
    auth.resend.mockResolvedValue({error:{status:400,code:'user_not_found'}});
    const response=await request('resend',{email:signup.email,captchaToken:'test-captcha'});
    expect(response.status).toBe(200);expect(await response.json()).toMatchObject({confirmation:true});
    expect(auth.resend).toHaveBeenCalledWith({type:'signup',email:signup.email,options:{emailRedirectTo:'https://goatlab.my/auth/callback',captchaToken:'test-captcha'}});
  });
  it('does not claim delivery when SMTP is unavailable',async()=>{
    auth.resend.mockResolvedValue({error:{status:400,code:'email_address_not_authorized'}});
    expect((await request('resend',{email:signup.email,captchaToken:'test-captcha'})).status).toBe(503);
  });
});
