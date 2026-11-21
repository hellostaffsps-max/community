import {availableSocialProviders} from '@/lib/social-auth';
import {json} from '@/lib/http';

export const dynamic='force-dynamic';
export async function GET(){
  return json({providers:await availableSocialProviders()});
}
