import {describe,it,expect} from 'vitest';
import {initialEditorValues} from '../src/lib/recipe-builder';
import {parseRecipeDraft,serializeRecipeDraft,readRecipeDraft,writeRecipeDraft,removeRecipeDraft,removeSavedRecipeDraft,recipeDraftKey,RECIPE_DRAFT_TTL,type RecipeDraftSnapshot,type DraftStorage} from '../src/lib/recipe-draft';

const scope={ownerId:'owner-a',recipeId:null};const now=1_800_000_000_000;
const snapshot:RecipeDraftSnapshot={writerId:'editor-a',values:{...initialEditorValues(),title:'تجربة لم أنشرها',method:'أداة مخصصة'},ingredients:[{key:'a',name:'قهوة',quantity:'١٨',unit:'g'}],steps:[{key:'step',instruction:'مرحلة التحضير الأولى'}],stage:2,baseVersion:null,legacyMetricsAccepted:false};
function memoryStorage():DraftStorage{const values=new Map<string,string>();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>{values.set(key,value);},removeItem:key=>{values.delete(key);}};}

describe('recoverable recipe drafts',()=>{
  it('restores the latest text, incomplete fields, ordering, and editor stage after remount',()=>{
    const storage=memoryStorage();expect(writeRecipeDraft(storage,scope,snapshot,now)).toBe(true);
    const updated={...snapshot,values:{...snapshot.values,title:'آخر تعديل'},ingredients:[...snapshot.ingredients,{key:'b',name:'ماء',quantity:'',unit:'ml'}],stage:3};
    expect(writeRecipeDraft(storage,scope,updated,now+100)).toBe(true);
    expect(readRecipeDraft(storage,scope,now+101).draft).toMatchObject(updated);
  });
  it('isolates accounts, existing recipes, blank drafts, and starter templates',()=>{
    const storage=memoryStorage();writeRecipeDraft(storage,scope,snapshot,now);
    for(const other of [{ownerId:'owner-b',recipeId:null},{...scope,recipeId:'recipe-1'},{...scope,templateKey:'v60'},{...scope,templateKey:'blank'}]){
      expect(readRecipeDraft(storage,other,now).draft).toBeNull();
      expect(parseRecipeDraft(serializeRecipeDraft(scope,snapshot,now),other,now)).toBeNull();
      expect(recipeDraftKey(other)).not.toBe(recipeDraftKey(scope));
    }
  });
  it('keeps prior recipe version for explicit review instead of hiding a stale draft',()=>{
    const old={...snapshot,baseVersion:3};
    expect(parseRecipeDraft(serializeRecipeDraft({...scope,recipeId:'r'},old,now),{...scope,recipeId:'r'},now)?.baseVersion).toBe(3);
  });
  it('never serializes photos, credentials, or unknown nested fields',()=>{
    const unsafeSnapshot={...snapshot,password:'secret',image:{name:'photo.jpg',data:'bytes'},values:{...snapshot.values,accessToken:'token'},ingredients:[{...snapshot.ingredients[0],privateKey:'key'}]};
    const raw=serializeRecipeDraft(scope,unsafeSnapshot,now)!;
    for(const sensitive of ['secret','photo.jpg','bytes','token','privateKey'])expect(raw).not.toContain(sensitive);
    expect(parseRecipeDraft(raw,scope,now)?.values.title).toBe(snapshot.values.title);
  });
  it('rejects malformed, oversized, expired, future, and wrong-schema data safely',()=>{
    const raw=serializeRecipeDraft(scope,snapshot,now)!;
    expect(parseRecipeDraft('{bad',scope,now)).toBeNull();expect(parseRecipeDraft('x'.repeat(200_001),scope,now)).toBeNull();
    expect(parseRecipeDraft(raw,scope,now+RECIPE_DRAFT_TTL+1)).toBeNull();expect(parseRecipeDraft(raw,scope,now-300_001)).toBeNull();
    expect(parseRecipeDraft(raw.replace('"schema":1','"schema":2'),scope,now)).toBeNull();
  });
  it('removes only the active draft after save or explicit discard',()=>{
    const storage=memoryStorage();const other={...scope,templateKey:'v60'};
    writeRecipeDraft(storage,scope,snapshot,now);writeRecipeDraft(storage,other,snapshot,now);
    expect(removeRecipeDraft(storage,scope)).toBe(true);expect(readRecipeDraft(storage,scope,now).draft).toBeNull();expect(readRecipeDraft(storage,other,now).draft).not.toBeNull();
  });
  it('does not let a delayed save erase a newer editor or newer content in the same slot',()=>{
    const storage=memoryStorage();writeRecipeDraft(storage,scope,snapshot,now);
    const newEditor={...snapshot,writerId:'editor-b'};writeRecipeDraft(storage,scope,newEditor,now+1);
    expect(removeSavedRecipeDraft(storage,scope,snapshot,now+2).removed).toBe(false);expect(readRecipeDraft(storage,scope,now+2).draft?.writerId).toBe('editor-b');
    const newerContent={...snapshot,values:{...snapshot.values,title:'تعديل أحدث لم يُرسل'}};writeRecipeDraft(storage,scope,newerContent,now+3);
    expect(removeSavedRecipeDraft(storage,scope,snapshot,now+4).removed).toBe(false);expect(readRecipeDraft(storage,scope,now+4).draft?.values.title).toBe(newerContent.values.title);
    expect(removeSavedRecipeDraft(storage,scope,newerContent,now+5).removed).toBe(true);expect(readRecipeDraft(storage,scope,now+5).draft).toBeNull();
  });
  it('reports blocked or full browser storage without throwing or pretending the draft was saved',()=>{
    const blocked:DraftStorage={getItem(){throw Error('disabled');},setItem(){throw Error('quota');},removeItem(){throw Error('disabled');}};
    expect(readRecipeDraft(blocked,scope,now)).toEqual({draft:null,unavailable:true});expect(writeRecipeDraft(blocked,scope,snapshot,now)).toBe(false);expect(removeRecipeDraft(blocked,scope)).toBe(false);
  });
});
