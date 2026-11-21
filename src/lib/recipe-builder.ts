import {recipeSchema,type RecipeInput} from './validation';
import type {Recipe} from './types';
import {deriveIngredientMetrics,ingredientMetric} from './recipe-quantities';

export const brewingTools=[
  ['V60','V60 · تقطير يدوي'],['Chemex','كيمكس · Chemex'],['Kalita Wave','كاليتا · Kalita Wave'],
  ['Origami','أوريغامي · Origami'],['Espresso','ماكينة إسبريسو'],['AeroPress','إيروبرس · AeroPress'],
  ['French Press','فرنش برس'],['Moka Pot','موكا بوت'],['Cold Brew','كولد برو'],['Turkish','ركوة قهوة تركية'],['Batch Brew','ماكينة قهوة مقطّرة'],
] as const;
export const grindOptions=['ناعم جدًا','ناعم','متوسط ناعم','متوسط','متوسط خشن','خشن'];
export const ingredientOptions=['قهوة','ماء','حليب','ثلج','سكر','عسل','كاكاو','شراب منكّه','هيل'];
export const unitOptions=[['g','غرام · g'],['ml','ملليلتر · ml'],['kg','كيلوغرام · kg'],['l','لتر · L'],['tsp','ملعقة صغيرة'],['tbsp','ملعقة كبيرة'],['piece','قطعة']] as const;
export const fieldLabels:Record<string,string>={title:'اسم الوصفة',description:'وصف التجربة',category_id:'نوع المشروب',method:'أداة التحضير',beans:'البن',roaster:'المحمصة',grind:'درجة الطحن',dose_g:'جرعة البن',water_g:'الماء',yield_g:'الناتج',temperature_c:'الحرارة',time_seconds:'وقت التحضير',tasting_notes:'ملاحظات التذوّق',ingredients:'المكونات',steps:'خطوات التحضير'};
export type EditorValues=Record<'title'|'description'|'category_id'|'method'|'beans'|'roaster'|'grind'|'dose_g'|'water_g'|'yield_g'|'temperature_c'|'minutes'|'seconds'|'tasting_notes',string>;
export type EditorIngredient={key:string;name:string;quantity:string;unit:string};
export type EditorStep={key:string;instruction:string};
export type FieldErrors=Record<string,string>;

export function initialEditorValues(recipe?:Partial<RecipeInput>,category='coffee'):EditorValues{
  return {title:recipe?.title||'',description:recipe?.description||'',category_id:recipe?.category_id||category,method:recipe?.method||'',beans:recipe?.beans||'',roaster:recipe?.roaster||'',grind:recipe?.grind||'',dose_g:String(recipe?.dose_g??''),water_g:String(recipe?.water_g??''),yield_g:String(recipe?.yield_g??''),temperature_c:String(recipe?.temperature_c??''),minutes:recipe?.time_seconds!=null?String(Math.floor(recipe.time_seconds/60)):'',seconds:recipe?.time_seconds!=null?String(recipe.time_seconds%60):'',tasting_notes:recipe?.tasting_notes||''};
}
export function initialEditorIngredients(recipe?:Pick<RecipeInput,'ingredients'|'dose_g'|'water_g'>):EditorIngredient[]{
  const rows=(recipe?.ingredients||[]).map((item,index)=>({...item,key:`ingredient-${index}`,quantity:String(item.quantity??'')}));
  for(const metric of ['dose_g','water_g'] as const){
    if(recipe?.[metric]!=null&&!rows.some(row=>ingredientMetric(row.name)===metric))rows.push({key:`legacy-${metric}`,name:metric==='dose_g'?'قهوة':'ماء',quantity:String(recipe[metric]),unit:'g'});
  }
  return rows.length?rows:[{key:'ingredient-0',name:'',quantity:'',unit:'g'}];
}
export function editorIngredientMetrics(ingredients:EditorIngredient[]){return deriveIngredientMetrics(ingredients.map(item=>({...item,quantity:editorNumber(item.quantity)})));}
export function legacyMetricConflicts(recipe:Pick<RecipeInput,'dose_g'|'water_g'>|undefined,ingredients:EditorIngredient[]){
  const derived=editorIngredientMetrics(ingredients);
  return (['dose_g','water_g'] as const).filter(metric=>recipe?.[metric]!=null&&(derived[metric]==null||Math.abs(recipe[metric]!-derived[metric]!)>0.000001));
}
export function editorNumber(value:string):number|null{
  const normalized=value.trim().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776)).replace(/[٫,]/g,'.');
  if(!normalized)return null;
  return /^\d+(?:\.\d+)?$/.test(normalized)?Number(normalized):NaN;
}
export function editorPayload(values:EditorValues,ingredients:EditorIngredient[],steps:EditorStep[],status:RecipeInput['status'],recipe?:Pick<Recipe,'id'|'version'>){
  const {minutes,seconds,...text}=values;const mins=editorNumber(minutes),secs=editorNumber(seconds);
  const duration=mins===null&&secs===null?null:(!Number.isInteger(mins??0)||!Number.isInteger(secs??0)||(secs??0)>59)?NaN:(mins??0)*60+(secs??0);
  const derived=editorIngredientMetrics(ingredients);
  return {...text,...Object.fromEntries(['yield_g','temperature_c'].map(key=>[key,editorNumber(values[key as keyof EditorValues])])),dose_g:derived.dose_g,water_g:derived.water_g,time_seconds:duration,status,
    // Empty rows are placeholders; partially completed rows must still be validated.
    ingredients:ingredients.filter(row=>row.name.trim()||row.quantity.trim()).map(({name,quantity,unit})=>({name,quantity:editorNumber(quantity),unit})),
    steps:steps.filter(row=>row.instruction.trim()).map(({instruction})=>({instruction})),
    ...(recipe?{id:recipe.id,version:recipe.version}:{})};
}
export function validateEditor(payload:ReturnType<typeof editorPayload>):{data?:RecipeInput;errors:FieldErrors}{
  const parsed=recipeSchema.safeParse(payload);const errors:FieldErrors={};
  if(!parsed.success)for(const issue of parsed.error.issues){
    const key=issue.path.join('.');const field=String(issue.path[0]);
    if(field==='ingredients'){
      const part=issue.path[2];const quantity=payload.ingredients[Number(issue.path[1])]?.quantity;
      errors[key]=part==='name'?'اختر اسم المكوّن أو اكتب اسمه (حتى 100 حرف).':part==='unit'?'اكتب وحدة لا تزيد على 30 حرفًا.':part==='quantity'?issue.code==='too_big'?'الكمية يجب ألا تزيد على 100000.':typeof quantity==='number'&&quantity>0&&quantity<0.01?'أصغر كمية مسموحة هي 0.01، أو اتركها فارغة.':'اكتب كمية أكبر من صفر، أو اتركها فارغة.':'يمكن إضافة 30 مكوّنًا كحد أقصى.';
    }else errors[key]=field==='title'?'اكتب اسمًا من حرفين إلى 120 حرفًا.':field==='time_seconds'?'أدخل دقائق صحيحة، وثواني بين 0 و59 (الحد الأقصى 48 ساعة).':field==='dose_g'?'مجموع جرعة البن يجب أن يكون بين 0.01 و1000 غرام. عدّل كمية البن أو وحدتها.':field==='water_g'?'مجموع الماء يجب أن يكون بين 0.01 و20000 غرام. عدّل كمية الماء أو وحدتها.':field==='steps'?'أضف خطوة تحضير واحدة على الأقل، بحد أقصى 2000 حرف للخطوة.':`${fieldLabels[field]||'هذا الحقل'}: راجع القيمة والطول المسموح.`;
  }
  Object.assign(errors,deriveIngredientMetrics(payload.ingredients).errors);
  if(payload.status==='published'){
    if(!payload.method.trim())errors.method='اختر أداة التحضير حتى يسهل العثور على وصفتك.';
    if(!payload.ingredients.length)errors.ingredients='أضف مكوّنًا واحدًا على الأقل قبل النشر.';
    if(!payload.steps.length)errors.steps='أضف خطوة تحضير واحدة على الأقل قبل النشر.';
  }
  return {data:parsed.success&&!Object.keys(errors).length?parsed.data:undefined,errors};
}
export function fieldStage(path:string){return path.startsWith('ingredients')?1:path.startsWith('steps')||path==='tasting_notes'?2:['dose_g','water_g','yield_g','temperature_c','time_seconds','grind','beans','roaster'].includes(path)?1:0;}

/** Validation paths must refer to the visible rows, including blank placeholders. */
export function validateEditorForm(values:EditorValues,ingredients:EditorIngredient[],steps:EditorStep[],status:RecipeInput['status'],recipe?:Pick<Recipe,'id'|'version'>){
  const result=validateEditor(editorPayload(values,ingredients,steps,status,recipe));
  const indices={ingredients:ingredients.flatMap((row,index)=>row.name.trim()||row.quantity.trim()?[index]:[]),steps:steps.flatMap((row,index)=>row.instruction.trim()?[index]:[])};
  const errors:FieldErrors={};
  for(const [path,message] of Object.entries(result.errors)){
    if(path==='dose_g'||path==='water_g'){
      const index=ingredients.findIndex(row=>ingredientMetric(row.name)===path);
      if(index>=0){errors[`ingredients.${index}.quantity`]=message;continue;}
    }
    const match=/^(ingredients|steps)\.(\d+)\.(.+)$/.exec(path);
    const visibleIndex=match?indices[match[1] as keyof typeof indices][Number(match[2])]:undefined;
    errors[match&&visibleIndex!==undefined?`${match[1]}.${visibleIndex}.${match[3]}`:path]=message;
  }
  return {...result,errors};
}

export function editorErrorField(path:string,ingredients:EditorIngredient[],steps:EditorStep[],values:EditorValues){
  const row=/^(ingredients|steps)\.(\d+)\.(.+)$/.exec(path);
  if(row?.[1]==='ingredients'){
    const item=ingredients[Number(row[2])];
    if(item)return `${row[3]==='name'?'ingredient':row[3]}-${item.key}`;
  }
  if(row?.[1]==='steps'&&steps[Number(row[2])])return `step-${steps[Number(row[2])].key}`;
  if(path==='ingredients')return ingredients[0]?`ingredient-${ingredients[0].key}`:'add-ingredient';
  if(path==='dose_g'||path==='water_g'){
    const item=ingredients.find(item=>ingredientMetric(item.name)===path);
    return item?`quantity-${item.key}`:'add-ingredient';
  }
  if(path==='steps')return steps[0]?`step-${steps[0].key}`:'add-step';
  if(path==='time_seconds'){
    const minutes=editorNumber(values.minutes),seconds=editorNumber(values.seconds);
    return Number.isInteger(minutes??0)&&(!Number.isInteger(seconds??0)||(seconds??0)>59)?'seconds':'minutes';
  }
  return path;
}

export function restoreEditorRow<T extends {key:string}>(rows:T[],removed:{item:T;index:number}):T[]{
  if(rows.length>=30||rows.some(row=>row.key===removed.item.key))return rows;
  const result=[...rows];result.splice(Math.max(0,Math.min(removed.index,result.length)),0,removed.item);return result;
}
