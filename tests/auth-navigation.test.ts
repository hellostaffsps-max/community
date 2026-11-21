import {describe,expect,it} from 'vitest';
import {authHref,safeAuthNext} from '../src/lib/auth-navigation';
import {accountNeedsSetup,hasGeneratedUsername} from '../src/lib/member-onboarding';

describe('authentication return destinations',()=>{
  it('preserves recipe creation, account tab and recipe anchor destinations',()=>{
    for(const path of ['/recipes/new?template=v60','/account?tab=saved','/recipes/6f71a431-a084-4e37-902d-aed72a493841#comments','/explore?method=V60'])expect(safeAuthNext(path)).toBe(path);
    const link=authHref('signup','/recipes/new?template=v60');
    expect(new URL(link,'https://goatlab.my').searchParams.get('next')).toBe('/recipes/new?template=v60');
    expect(authHref('login',safeAuthNext(undefined))).toBe('/auth/login');
  });
  it('rejects remote, executable, encoded, control-character and authentication-loop destinations',()=>{
    const invalid:unknown[]=[undefined,null,['/account'],'https://foreign.invalid','//foreign.invalid','javascript:alert(1)','/\\foreign.invalid','/\n/foreign.invalid','/%2f%2fforeign.invalid','/%255cforeign.invalid','/%00foreign.invalid','/auth/login','/api/auth/logout','/recipes/../auth/login','/%2561uth/login','/%','/'+'x'.repeat(2048)];
    for(const path of invalid)expect(safeAuthNext(path),String(path)).toBe('/account');
    expect(authHref('../../api/logout','//foreign.invalid')).toBe('/auth/login');
  });
});

describe('member setup detection',()=>{
  it('recognizes generated identities without treating ordinary usernames as incomplete',()=>{
    expect(accountNeedsSetup({display_name:'عضو جديد',username:'u_e1e684967f76429f8a396b80'})).toBe(true);
    expect(accountNeedsSetup({display_name:'ليان',username:'u_e1e684967f76429f8a396b80'})).toBe(true);
    expect(accountNeedsSetup({display_name:'ليان',username:'layan_coffee'})).toBe(false);
    expect(hasGeneratedUsername('u_coffee_lover')).toBe(false);
  });
});
