'use client';
import {useState} from 'react';
import Link from 'next/link';
import {Plus,Trash2,ArrowUpLeft} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {api,Field,Notice,useAction} from './shared';
import type {Recipe} from '@/lib/types';
export function RecipeEditor({recipe,categories}:{recipe?:Recipe;categories:{id:string;name_ar:string}[]}){
  const router=useRouter();const action=useAction();
  const [ingredients,setIngredients]=useState(recipe?.ingredients||[{name:'',quantity:null,unit:'g'}]);
  const [steps,setSteps]=useState(recipe?.steps||[{instruction:''}]);
  const [savedId,setSavedId]=useState<string|null>(null);
  return <div className="editor-wrap"><div className="page-heading"><span className="eyebrow">من دفتر تجاربك، للمجتمع</span><h1>{recipe?'طوّر وصفتك.':'شاركنا طريقتك.'}</h1><p>وصفة واضحة تساعد غيرك على تكرار التجربة. احفظها كمسودة متى احتجت.</p></div>
  <form onSubmit={async e=>{e.preventDefault();const form=new FormData(e.currentTarget);const submitter=(e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement|null;const payload:Record<string,unknown>={ingredients,steps,status:submitter?.value||'draft'};
    for(const name of ['title','description','category_id','method','beans','roaster','tasting_notes','grind'])payload[name]=String(form.get(name)||'');
    for(const name of ['dose_g','water_g','yield_g','temperature_c','time_seconds'])payload[name]=form.get(name)===''?null:Number(form.get(name));
    if(recipe){payload.id=recipe.id;payload.version=recipe.version;}
    const result=await action.run(async()=>{const saved=await api<{id:string}>('/api/community/recipes','POST',payload);setSavedId(saved.id);const image=form.get('image');if(image instanceof File&&image.size){const upload=new FormData();upload.set('kind','recipe');upload.set('recipe_id',saved.id);upload.set('file',image);await api('/api/community/images','POST',upload);}return saved;});
    if(result){router.push(`/recipes/${result.id}`);router.refresh();}}}>
    <fieldset disabled={action.busy||!!savedId}>
    <section className="form-section"><div className="section-title"><span>01</span><div><h2>حكاية الوصفة</h2><p>ماذا سنحضّر اليوم؟</p></div></div>
      <Field label="اسم الوصفة *"><input name="title" required minLength={2} maxLength={120} defaultValue={recipe?.title} placeholder="مثلًا: V60 صباحي بنكهة الفواكه"/></Field>
      <Field label="عن الوصفة"><textarea name="description" rows={3} maxLength={3000} defaultValue={recipe?.description} placeholder="ما الذي يميّز هذه التجربة؟"/></Field>
      <div className="form-grid"><Field label="نوع المشروب"><select name="category_id" defaultValue={recipe?.category_id||'coffee'}>{categories.map(c=><option key={c.id} value={c.id}>{c.name_ar}</option>)}</select></Field>
      <Field label="الأداة / طريقة التحضير"><input name="method" maxLength={80} defaultValue={recipe?.method} list="methods" placeholder="V60، إسبريسو، إيروبرس…"/><datalist id="methods">{['V60','Espresso','AeroPress','French Press','Cold Brew','Turkish'].map(m=><option key={m} value={m}/>)}</datalist></Field>
      <Field label="البن"><input name="beans" maxLength={150} defaultValue={recipe?.beans} placeholder="المنشأ، المعالجة أو اسم البن"/></Field>
      <Field label="المحمصة (اختياري)"><input name="roaster" maxLength={120} defaultValue={recipe?.roaster}/></Field></div>
      <Field label="صورة الوصفة (اختياري)" hint="JPG أو PNG أو WebP، حتى 5 MB. صورة المسودة تبقى خاصة."><input name="image" type="file" accept="image/jpeg,image/png,image/webp"/></Field>
    </section>
    <section className="form-section"><div className="section-title"><span>02</span><div><h2>المكونات والمقادير</h2><p>أضف ما تحتاجه فقط. الكمية والوحدة اختياريتان.</p></div></div>
    {ingredients.map((item,index)=><div className="ingredient-row" key={index}>
      <Field label={`المكوّن ${index+1}`}><input value={item.name} required maxLength={100} onChange={e=>setIngredients(items=>items.map((x,i)=>i===index?{...x,name:e.target.value}:x))}/></Field>
      <Field label="الكمية"><input type="number" dir="ltr" min="0.01" max="100000" step="any" value={item.quantity??''} onChange={e=>setIngredients(items=>items.map((x,i)=>i===index?{...x,quantity:e.target.value?Number(e.target.value):null}:x))}/></Field>
      <Field label="الوحدة"><input maxLength={30} value={item.unit} onChange={e=>setIngredients(items=>items.map((x,i)=>i===index?{...x,unit:e.target.value}:x))}/></Field>
      <button className="icon-button" type="button" aria-label={`حذف المكوّن ${index+1}`} onClick={()=>setIngredients(items=>items.filter((_,i)=>i!==index))}><Trash2 size={18}/></button>
    </div>)}
    <button className="button secondary small" type="button" disabled={ingredients.length>=30} onClick={()=>setIngredients(items=>[...items,{name:'',quantity:null,unit:''}])}><Plus size={17}/>أضف مكوّنًا</button>
    </section>
    <section className="form-section"><div className="section-title"><span>03</span><div><h2>خطوة بخطوة</h2><p>اكتب الخطوات بالترتيب الذي تتبعه.</p></div></div>
    {steps.map((step,index)=><div className="step-row" key={index}><span className="step-number">{index+1}</span><Field label={`الخطوة ${index+1}`}><textarea required rows={2} maxLength={2000} value={step.instruction} onChange={e=>setSteps(items=>items.map((x,i)=>i===index?{instruction:e.target.value}:x))}/></Field><button className="icon-button" type="button" aria-label={`حذف الخطوة ${index+1}`} onClick={()=>setSteps(items=>items.filter((_,i)=>i!==index))}><Trash2 size={18}/></button></div>)}
    <button className="button secondary small" type="button" disabled={steps.length>=30} onClick={()=>setSteps(items=>[...items,{instruction:''}])}><Plus size={17}/>أضف خطوة</button>
    </section>
    <section className="form-section"><div className="section-title"><span>04</span><div><h2>تفاصيل تصنع الفرق</h2><p>كل هذه الحقول اختيارية؛ اترك ما لا يناسب وصفتك فارغًا.</p></div></div>
    <div className="form-grid metrics-grid">{([{name:'dose_g',label:'جرعة البن (g)',max:1000},{name:'water_g',label:'الماء (g)',max:20000},{name:'yield_g',label:'الناتج (g)',max:20000},{name:'temperature_c',label:'الحرارة (°C)',max:100},{name:'time_seconds',label:'الوقت (ثانية)',max:172800}] as const).map(f=><Field key={f.name} label={f.label}><input type="number" dir="ltr" name={f.name} min={f.name==='temperature_c'?0:0.01} max={f.max} step={f.name==='time_seconds'?1:'any'} defaultValue={recipe?.[f.name]??''}/></Field>)}
    <Field label="درجة الطحن"><input name="grind" maxLength={120} defaultValue={recipe?.grind}/></Field></div>
    <Field label="ملاحظات الطعم والتجربة"><textarea name="tasting_notes" rows={3} maxLength={1000} defaultValue={recipe?.tasting_notes} placeholder="ماذا تذوقت؟ وماذا ستغيّر في المرة المقبلة؟"/></Field>
    </section>
    <div className="editor-actions"><button className="button" type="submit" value="published">{action.busy?'جاري الحفظ…':'انشر الوصفة'}<ArrowUpLeft size={19}/></button><button className="button secondary" type="submit" value="draft">احفظ كمسودة</button><Link href="/account" className="text-link">إلغاء</Link></div>
    </fieldset>
    {action.message&&<Notice error={action.failed}>{action.message}</Notice>}
    {savedId&&action.failed&&<Notice>تم حفظ الوصفة، لكن لم تكتمل الصورة. <Link href={`/recipes/${savedId}/edit`}>افتح الوصفة وحاول رفع الصورة مجددًا</Link>.</Notice>}
  </form></div>;
}
