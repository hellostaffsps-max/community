import assert from 'node:assert/strict';
const origin=process.argv[2]||'http://127.0.0.1:3000';
assert(['127.0.0.1','localhost'].includes(new URL(origin).hostname),'Smoke tests only target local previews');
async function request(path,options={}){return fetch(origin+path,{...options,signal:AbortSignal.timeout(30000)});}
const root=await request('/');assert.equal(root.status,200);assert.match(await root.text(),/وراء كل فنجان/);assert.match(root.headers.get('cache-control')||'',/no-store/);
console.log('PASS: real discovery renders with no-store');
const account=await request('/account');assert.match(await account.text(),/auth\/login|أهلًا بعودتك/);console.log('PASS: anonymous account access redirects to login');
const signup=await request('/auth/signup');assert.match(await signup.text(),/التسجيل لم يُفتح بعد/);console.log('PASS: signup remains closed');
const crossSite=await request('/api/community/recipes',{method:'POST',headers:{origin:'https://untrusted.invalid','content-type':'application/json'},body:'{}'});assert.equal(crossSite.status,403);console.log('PASS: cross-origin mutation rejected');
const anonymous=await request('/api/community/recipes',{method:'POST',headers:{origin,'content-type':'application/json'},body:'{}'});assert.equal(anonymous.status,401);console.log('PASS: anonymous mutation rejected');
const invalidImage=await request('/api/media?bucket=avatars&path=../../secret');assert.equal(invalidImage.status,400);console.log('PASS: invalid image path rejected');
