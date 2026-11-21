import {describe,it,expect} from 'vitest';
import {editorErrorField,editorNumber,editorPayload,fieldStage,initialEditorValues,initialEditorIngredients,legacyMetricConflicts,restoreEditorRow,validateEditor,validateEditorForm} from '../src/lib/recipe-builder';
import {deriveIngredientMetrics} from '../src/lib/recipe-quantities';
describe('recipe builder input and publication',()=>{
  const values={...initialEditorValues(),title:'قهوة الصباح',method:'V60'};
  it('accepts Arabic and Persian decimal quantities without losing zero',()=>{
    expect(editorNumber('١٦٫٥')).toBe(16.5);expect(editorNumber('۲۵۰')).toBe(250);expect(editorNumber('0')).toBe(0);expect(editorNumber('')).toBeNull();expect(editorNumber('1e5')).toBeNaN();
  });
  it('saves an incomplete draft without manufacturing ingredients or steps',()=>{
    const payload=editorPayload(values,[{key:'a',name:'',quantity:'',unit:'g'}],[{key:'a',instruction:''}],'draft');
    expect(validateEditor(payload).data?.ingredients).toEqual([]);expect(payload.time_seconds).toBeNull();
  });
  it('requires an instrument, ingredient and step before publication',()=>{
    expect(validateEditor(editorPayload({...values,method:''},[],[],'published')).errors).toMatchObject({method:expect.any(String),ingredients:expect.any(String),steps:expect.any(String)});
  });
  it('converts minutes and seconds to whole seconds and rejects decimal seconds',()=>{
    expect(editorPayload({...values,minutes:'٣',seconds:'٣٠'},[],[],'draft').time_seconds).toBe(210);
    expect(validateEditor(editorPayload({...values,minutes:'3',seconds:'0.01'},[],[],'draft')).errors.time_seconds).toBeTruthy();
    expect(validateEditor(editorPayload({...values,seconds:'60'},[],[],'draft')).errors.time_seconds).toBeTruthy();
  });
  it('does not silently discard a quantity entered without a name',()=>{
    const result=validateEditor(editorPayload(values,[{key:'a',name:'',quantity:'20',unit:'g'}],[],'draft'));
    expect(result.data).toBeUndefined();expect(Object.keys(result.errors)).toContain('ingredients.0.name');
  });
  it('retains optimistic version checks when editing and publishes ordered steps',()=>{
    const result=validateEditor(editorPayload(values,[{key:'a',name:'قهوة',quantity:'١٦',unit:'g'}],[{key:'1',instruction:'اطحن البن'},{key:'2',instruction:'حضّر القهوة'}],'published',{id:'bfec6658-f2c6-4fba-8bfc-6e28e9526790',version:3}));
    expect(result.data).toMatchObject({version:3,ingredients:[{name:'قهوة',quantity:16,unit:'g'}],steps:[{instruction:'اطحن البن'},{instruction:'حضّر القهوة'}]});
  });
  it('returns validation errors to the step that actually contains the field',()=>{
    expect(fieldStage('beans')).toBe(1);expect(fieldStage('roaster')).toBe(1);expect(fieldStage('ingredients.0.name')).toBe(1);expect(fieldStage('time_seconds')).toBe(1);expect(fieldStage('steps.0.instruction')).toBe(2);expect(fieldStage('method')).toBe(0);
  });
  it('attaches errors to the visible ingredient and step after blank placeholders are omitted from the API payload',()=>{
    const ingredients=[{key:'blank',name:'',quantity:'',unit:'g'},{key:'missing-name',name:'',quantity:'20',unit:'g'},{key:'bad-quantity',name:'حليب',quantity:'0',unit:'ml'}];
    const steps=[{key:'blank-step',instruction:'  '},{key:'long-step',instruction:'x'.repeat(2001)}];
    const result=validateEditorForm(values,ingredients,steps,'draft');
    expect(result.data).toBeUndefined();
    expect(result.errors['ingredients.1.name']).toBeTruthy();
    expect(result.errors['ingredients.2.quantity']).toBeTruthy();
    expect(result.errors['ingredients.2.quantity']).toBe('اكتب كمية أكبر من صفر، أو اتركها فارغة.');
    expect(result.errors['ingredients.1.name']).toContain('اسم المكوّن');
    expect(result.errors['steps.1.instruction']).toBeTruthy();
    expect(Object.keys(result.errors)).not.toContain('ingredients.0.name');
    expect(editorErrorField('ingredients.2.quantity',ingredients,steps,values)).toBe('quantity-bad-quantity');
    expect(editorErrorField('steps.1.instruction',ingredients,steps,values)).toBe('step-long-step');
  });
  it('targets missing rows and invalid time fields without losing Arabic input or changing the submitted data',()=>{
    expect(editorErrorField('ingredients',[],[],values)).toBe('add-ingredient');
    expect(editorErrorField('steps',[],[],values)).toBe('add-step');
    expect(editorErrorField('time_seconds',[],[],{...values,minutes:'٣',seconds:'٦٠'})).toBe('seconds');
    expect(editorErrorField('time_seconds',[],[],{...values,minutes:'١٫٥',seconds:'٣٠'})).toBe('minutes');
    const ingredients=[{key:'blank',name:'',quantity:'',unit:'g'},{key:'coffee',name:'قهوة',quantity:'١٨',unit:'g'}];
    const steps=[{key:'blank',instruction:''},{key:'first',instruction:'حضّر القهوة'}];
    expect(validateEditorForm(values,ingredients,steps,'published').data).toEqual(validateEditor(editorPayload(values,ingredients,steps,'published')).data);
  });
  it('attaches invalid derived totals to the same visible quantity field that receives focus',()=>{
    const ingredients=[{key:'blank',name:'',quantity:'',unit:'g'},{key:'coffee-first',name:'قهوة',quantity:'600',unit:'g'},{key:'coffee-second',name:'بن',quantity:'600',unit:'g'},{key:'water',name:'ماء',quantity:'21',unit:'l'}];
    const result=validateEditorForm(values,ingredients,[],'draft');
    expect(result.data).toBeUndefined();
    expect(result.errors['ingredients.1.quantity']).toContain('مجموع جرعة البن');
    expect(result.errors['ingredients.3.quantity']).toContain('مجموع الماء');
    expect(result.errors.dose_g).toBeUndefined();expect(result.errors.water_g).toBeUndefined();
    expect(editorErrorField('ingredients.1.quantity',ingredients,[],values)).toBe('quantity-coffee-first');
    expect(editorErrorField('ingredients.3.quantity',ingredients,[],values)).toBe('quantity-water');
    expect(result.errors['ingredients.0.quantity']).toBeUndefined();
  });
  it('undoes one deleted row at its position while retaining newer edits and respecting row limits',()=>{
    const removed={item:{key:'b',name:'حليب',quantity:'100',unit:'ml'},index:1};
    const current=[{key:'a',name:'قهوة',quantity:'20',unit:'g'},{key:'c',name:'سكر',quantity:'2',unit:'tsp'}];
    const restored=restoreEditorRow(current,removed);
    expect(restored.map(row=>row.key)).toEqual(['a','b','c']);
    expect(restored[0].quantity).toBe('20');expect(restored[1]).toEqual(removed.item);
    expect(current).toHaveLength(2);
    expect(restoreEditorRow(restored,removed)).toEqual(restored);
    const full=Array.from({length:30},(_,index)=>({...current[0],key:String(index)}));
    expect(restoreEditorRow(full,removed)).toHaveLength(30);
  });
  it('uses ingredient amounts as the only authority instead of stale metric fields',()=>{
    const payload=editorPayload({...values,dose_g:'99',water_g:'999'},[{key:'coffee',name:'قهوة',quantity:'١٨',unit:'g'},{key:'water',name:'ماء',quantity:'٠٫٣',unit:'l'}],[],'draft');
    expect(payload).toMatchObject({dose_g:18,water_g:300});expect(validateEditor(payload).data).toBeDefined();
  });
  it('sums split coffee/water amounts and converts only known equivalent units',()=>{
    expect(deriveIngredientMetrics([{name:'Coffee',quantity:0.01,unit:'kg'},{name:'قهوة',quantity:8,unit:'g'},{name:'water',quantity:0.1,unit:'L'},{name:'ماء',quantity:200,unit:'ml'}])).toEqual({dose_g:18,water_g:300,errors:{}});
  });
  it('does not invent a complete total when one coffee row has no quantity',()=>{
    expect(deriveIngredientMetrics([{name:'قهوة',quantity:18,unit:'g'},{name:'بن',quantity:null,unit:'g'}]).dose_g).toBeNull();
  });
  it('preserves mixed-drink ingredients and does not count milk, espresso, or ice as brewing water',()=>{
    const rows=[{key:'a',name:'إسبريسو',quantity:'36',unit:'ml'},{key:'b',name:'حليب',quantity:'150',unit:'ml'},{key:'c',name:'ثلج',quantity:'60',unit:'g'},{key:'d',name:'سكر',quantity:'1',unit:'tsp'}];
    const payload=editorPayload(values,rows,[],'draft');
    expect(payload.dose_g).toBeNull();expect(payload.water_g).toBeNull();expect(validateEditor(payload).data?.ingredients).toHaveLength(4);
  });
  it('preserves coffee spoon measurements without inventing a gram dose',()=>{
    const result=validateEditor(editorPayload(values,[{key:'a',name:'قهوة',quantity:'2',unit:'tbsp'}],[],'draft'));
    expect(result.data?.ingredients).toEqual([{name:'قهوة',quantity:2,unit:'tbsp'}]);expect(result.data?.dose_g).toBeNull();expect(result.errors).toEqual({});
    expect(deriveIngredientMetrics([{name:'قهوة',quantity:18,unit:'g'},{name:'قهوة',quantity:1,unit:'tsp'}]).dose_g).toBeNull();
  });
  it('preserves legacy metric-only recipes as explicit ingredient rows',()=>{
    const legacy={ingredients:[{name:'حليب',quantity:100,unit:'ml'}],dose_g:18,water_g:300};
    const rows=initialEditorIngredients(legacy);
    expect(rows.map(({name,quantity,unit})=>({name,quantity,unit}))).toEqual([{name:'حليب',quantity:'100',unit:'ml'},{name:'قهوة',quantity:'18',unit:'g'},{name:'ماء',quantity:'300',unit:'g'}]);
    expect(legacyMetricConflicts(legacy,rows)).toEqual([]);
  });
  it('flags old conflicting metrics without overwriting original ingredient amounts',()=>{
    const legacy={ingredients:[{name:'قهوة',quantity:16,unit:'g'},{name:'ماء',quantity:0.3,unit:'l'}],dose_g:18,water_g:300};
    const rows=initialEditorIngredients(legacy);
    expect(rows[0].quantity).toBe('16');expect(legacyMetricConflicts(legacy,rows)).toEqual(['dose_g']);
  });
  it('handles decimal unit conversion without false legacy conflicts',()=>{
    const legacy={ingredients:[{name:'قهوة',quantity:0.018,unit:'kg'}],dose_g:18,water_g:null};
    expect(legacyMetricConflicts(legacy,initialEditorIngredients(legacy))).toEqual([]);
  });
});
