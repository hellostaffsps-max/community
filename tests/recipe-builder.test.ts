import {describe,it,expect} from 'vitest';
import {editorNumber,editorPayload,fieldStage,initialEditorValues,validateEditor} from '../src/lib/recipe-builder';
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
});
