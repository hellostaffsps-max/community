import {beforeEach,describe,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';

const {getViewer,client}=vi.hoisted(()=>({getViewer:vi.fn(),client:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('../src/lib/supabase/server',()=>({supabase:client}));
vi.mock('../src/lib/data',()=>({viewer:getViewer}));

import PrivacyPage from '../src/app/privacy/page';

beforeEach(()=>{
  vi.clearAllMocks();
  vi.stubEnv('ALLOW_PUBLIC_SIGNUP','true');
  vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY','test-key');
  client.mockResolvedValue({});
});

describe('privacy page account navigation',()=>{
  it('keeps the signed-in navigation while leaving the policy visible',async()=>{
    getViewer.mockResolvedValue({id:'00000000-0000-4000-8000-000000000099',moderator:false});
    const html=renderToStaticMarkup(await PrivacyPage());
    expect(html).toContain('سياسة الخصوصية');
    expect(html).toContain('journey-profile-link');
    expect(html).not.toContain('journey-login-link');
    expect(html).not.toContain('انضم مجانًا');
  });

  it('reads the current request again after a previous signed-in render',async()=>{
    getViewer.mockResolvedValueOnce({id:'00000000-0000-4000-8000-000000000099',moderator:false}).mockResolvedValueOnce(null);
    await PrivacyPage();
    const html=renderToStaticMarkup(await PrivacyPage());
    expect(client).toHaveBeenCalledTimes(2);
    expect(html).toContain('journey-login-link');
    expect(html).toContain('/auth/login?next=%2Fprivacy');
    expect(html).not.toContain('journey-profile-link');
  });

  it('keeps the public policy readable if authentication is unavailable',async()=>{
    client.mockRejectedValueOnce(new Error('unavailable'));
    const html=renderToStaticMarkup(await PrivacyPage());
    expect(html).toContain('id="privacy-contact"');
    expect(html).toContain('سياسة الخصوصية');
    expect(html).not.toContain('journey-profile-link');
  });
});
