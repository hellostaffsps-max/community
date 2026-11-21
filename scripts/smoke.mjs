import assert from 'node:assert/strict';

const base=new URL(process.argv[2]||'http://127.0.0.1:3000');
const expectOpen=process.argv.includes('--expect-signup=open');
assert(['127.0.0.1','localhost'].includes(base.hostname),'Smoke tests only target local previews');
assert(['http:','https:'].includes(base.protocol),'Smoke tests require an HTTP local preview');
const origin=base.origin;

function localUrl(path){
  const url=new URL(path,origin);
  assert.equal(url.origin,origin,'Smoke requests and redirects must stay on the local preview');
  return url;
}
async function request(path,options={}){
  // Cold Next development routes may compile before sending a response.
  // Inspect redirects explicitly so this script never follows one off localhost.
  return fetch(localUrl(path),{...options,credentials:'omit',redirect:'manual',signal:AbortSignal.timeout(90000)});
}
function decodeHtml(value){
  return value.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#(?:x27|39);/gi,"'");
}
function attribute(tag,name){
  for(const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)){
    if(match[1].toLowerCase()===name.toLowerCase())return decodeHtml(match[2]??match[3]);
  }
}
function links(html){
  return [...html.matchAll(/<a\b[^>]*>/gi)].map(match=>attribute(match[0],'href')).filter(Boolean);
}
function starterLinks(html){
  return [...new Set(links(html).filter(href=>href.startsWith('/learn/')))].sort();
}
async function redirectTarget(response){
  const location=response.headers.get('location');
  if(location)return localUrl(location);
  // App Router may stream a refresh meta tag after the response has begun.
  const html=await response.text();
  for(const match of html.matchAll(/<meta\b[^>]*>/gi)){
    if(attribute(match[0],'http-equiv')?.toLowerCase()!=='refresh')continue;
    const target=attribute(match[0],'content')?.match(/^\s*[\d.]+\s*;\s*url=(.+)\s*$/i)?.[1];
    if(target)return localUrl(target);
  }
  assert.fail('Expected a local login redirect, received HTTP '+response.status+' without a redirect destination');
}

const root=await request('/');
assert.equal(root.status,200);
assert.match(await root.text(),/وراء كل فنجان/);
assert.match(root.headers.get('cache-control')||'',/no-store/);
console.log('PASS: branded landing renders with no-store');

const discovery=await request('/explore');
assert.equal(discovery.status,200);
const discoveryHtml=await discovery.text();
assert.match(discoveryHtml,/ماذا سنحضّر اليوم/);
assert.match(discoveryHtml,/وصفات البداية/);
assert.deepEqual(starterLinks(discoveryHtml),[
  '/learn/aeropress-upright','/learn/french-press-basics','/learn/v60-first-cup'
]);
console.log('PASS: discovery exposes the three labeled starter guides');

const directory=await request('/people');
assert.equal(directory.status,200);
const directoryHtml=await directory.text();
assert.match(directoryHtml,/<h1[^>]*>أهل القهوة\.<\/h1>/);
assert.match(directoryHtml,/id="people-search"/);
assert.match(directoryHtml,/ابحث باسم الشخص/);
assert.ok(links(discoveryHtml).includes('/people'),'Discovery must expose the real people directory');
console.log('PASS: public people directory and accessible member search render');

for(const destination of ['/explore?feed=following','/people?view=following']){
  const gated=await request(destination);
  const target=await redirectTarget(gated);
  assert.equal(target.pathname,'/auth/login');
  assert.equal(target.searchParams.get('next'),destination,'Following login must retain the selected destination');
}
console.log('PASS: signed-out following feed and directory redirect to login with continuation');

const filtered=await request('/explore?method=V60');
assert.equal(filtered.status,200);
assert.deepEqual(starterLinks(await filtered.text()),['/learn/v60-first-cup']);
const searched=await request('/explore?'+new URLSearchParams({q:'فرنش'}));
assert.equal(searched.status,200);
assert.deepEqual(starterLinks(await searched.text()),['/learn/french-press-basics']);
console.log('PASS: starter guides respect brewing-method and Arabic search filters');

const templateDestination='/recipes/new?template=v60-first-cup';
const guide=await request('/learn/v60-first-cup');
assert.equal(guide.status,200);
const guideHtml=await guide.text();
assert.match(guideHtml,/فنجان V60، خطوة بخطوة/);
assert.match(guideHtml,/حضّرها على مهل/);
const guideUrls=links(guideHtml).map(href=>new URL(href,origin));
assert.ok(guideUrls.some(url=>url.hostname==='www.hario-usa.com'),'Starter guide must expose its reference source');
assert.ok(guideUrls.some(url=>url.pathname==='/auth/'+(expectOpen?'signup':'login')&&url.searchParams.get('next')===templateDestination),'Starter CTA must preserve the selected recipe template');
console.log('PASS: starter detail renders instructions, source and template continuation');

const account=await request('/account');
assert.equal((await redirectTarget(account)).pathname,'/auth/login');
console.log('PASS: anonymous account access redirects to login');

const templateRequest=await request(templateDestination);
const templateLogin=await redirectTarget(templateRequest);
assert.equal(templateLogin.pathname,'/auth/login');
assert.equal(templateLogin.searchParams.get('next'),templateDestination);
const login=await request(templateLogin);
assert.equal(login.status,200);
const loginHtml=await login.text();
assert.match(loginHtml,/أهلًا بعودتك/);
assert.match(loginHtml,/type="password"/);
const loginUrls=links(loginHtml).map(href=>new URL(href,origin));
for(const mode of ['login','forgot','verify',...(expectOpen?['signup']:[])]){
  const modeLinks=loginUrls.filter(url=>url.pathname==='/auth/'+mode);
  assert.ok(modeLinks.length>0,'Login page must expose '+mode+' navigation');
  for(const url of modeLinks)assert.equal(url.searchParams.get('next'),templateDestination,mode+' link must retain the recipe template');
}
console.log('PASS: anonymous recipe template reaches login and survives all auth navigation links');

const signup=await request('/auth/signup');
assert.match(await signup.text(),expectOpen?/أنشئ حسابك مجانًا/:/التسجيل لم يُفتح بعد/);
console.log('PASS: expected signup state');
const verify=await request('/auth/verify');
assert.equal(verify.status,200);
assert.match(await verify.text(),/رمز تأكيد البريد/);
console.log('PASS: email code screen renders');
const crossSite=await request('/api/community/recipes',{method:'POST',headers:{origin:'https://untrusted.invalid','content-type':'application/json'},body:'{}'});
assert.equal(crossSite.status,403);
console.log('PASS: cross-origin mutation rejected');
const anonymous=await request('/api/community/recipes',{method:'POST',headers:{origin,'content-type':'application/json'},body:'{}'});
assert.equal(anonymous.status,401);
console.log('PASS: anonymous mutation rejected');
// No cookies or credentials are sent. A synthetic UUID avoids targeting a real member.
const anonymousFollow=await request('/api/community/follows/00000000-0000-4000-8000-000000000001',{method:'POST',headers:{origin,'content-type':'application/json'},body:'{}'});
assert.equal(anonymousFollow.status,401);
console.log('PASS: anonymous follow request rejected before any member mutation');
const invalidImage=await request('/api/media?bucket=avatars&path=../../secret');
assert.equal(invalidImage.status,400);
console.log('PASS: invalid image path rejected');
