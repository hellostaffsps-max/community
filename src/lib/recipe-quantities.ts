export type BrewIngredient={name:string;quantity?:number|null;unit:string};
export type BrewMetric='dose_g'|'water_g';

export function ingredientMetric(name:string):BrewMetric|null{
  const normalized=name.trim().toLocaleLowerCase('en').replace(/\s+/g,' ');
  if(['قهوة','القهوة','بن','البن','coffee','ground coffee','coffee beans'].includes(normalized))return 'dose_g';
  if(['ماء','الماء','مياه','water'].includes(normalized))return 'water_g';
  return null;
}

// Only water volume has an explicit gram equivalent here. Milk, espresso,
// ice and spoon measures are never silently converted into brewing water/coffee.
export function deriveIngredientMetrics(ingredients:readonly BrewIngredient[]){
  const totals:Record<BrewMetric,number|null>={dose_g:null,water_g:null};
  const incomplete=new Set<BrewMetric>();const errors:Record<string,string>={};
  ingredients.forEach(item=>{
    const metric=ingredientMetric(item.name);if(!metric)return;
    if(item.quantity==null){incomplete.add(metric);return;}
    const unit=item.unit.trim().toLowerCase();
    const multiplier=unit==='g'?1:unit==='kg'?1000:metric==='water_g'&&unit==='ml'?1:metric==='water_g'&&unit==='l'?1000:null;
    if(multiplier==null){incomplete.add(metric);return;}
    if(!Number.isFinite(item.quantity)||item.quantity<=0){incomplete.add(metric);return;}
    totals[metric]=(totals[metric]??0)+item.quantity*multiplier;
  });
  for(const metric of ['dose_g','water_g'] as const){
    if(incomplete.has(metric))totals[metric]=null;
    else if(totals[metric]!=null)totals[metric]=Math.round(totals[metric]*1e6)/1e6;
  }
  return {...totals,errors};
}
