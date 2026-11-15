import { describe,it,expect } from 'vitest';
import { recipeSchema,profileSchema,reportSchema,imageType } from '../src/lib/validation';
import { boundedBody,assertOrigin } from '../src/lib/http';
describe('server input boundaries',()=>{
  const draft={title:'قهوة',category_id:'coffee',status:'draft',ingredients:[],steps:[]};
  it('accepts a draft without coffee-specific metrics',()=>expect(recipeSchema.parse(draft).dose_g).toBeUndefined());
  it('rejects forged owners and role fields',()=>{
    expect(recipeSchema.safeParse({...draft,owner_id:crypto.randomUUID()}).success).toBe(false);
    expect(profileSchema.safeParse({username:'barista',display_name:'بارستا',role:'admin'}).success).toBe(false);
  });
  it('rejects publishing empty recipes and malformed reports',()=>{
    expect(recipeSchema.safeParse({...draft,status:'published'}).success).toBe(false);
    expect(reportSchema.safeParse({reason:'محتوى مخالف'}).success).toBe(false);
  });
  it('sniffs bytes instead of trusting image names or SVG MIME types',()=>{
    expect(imageType(new TextEncoder().encode('<svg onload="alert(1)"></svg>'))).toBeNull();
    expect(imageType(new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]))?.mime).toBe('image/png');
  });
  it('rejects oversized streaming bodies without content-length',async()=>{
    await expect(boundedBody(new Request('http://localhost',{method:'POST',body:'a'.repeat(100)}),50)).rejects.toThrow();
  });
  it('rejects cross-origin mutations and absent origins',()=>{
    expect(()=>assertOrigin(new Request('http://localhost:3000',{headers:{Origin:'https://evil.example'}}))).toThrow();
    expect(()=>assertOrigin(new Request('http://localhost:3000'))).toThrow();
  });
});
