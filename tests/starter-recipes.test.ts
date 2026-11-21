import {describe,it,expect} from 'vitest';
import {starterRecipes,getStarterRecipe,findStarterRecipes,starterToInput} from '../src/lib/starter-recipes';
import {recipeSchema} from '../src/lib/validation';
describe('reference recipe journey',()=>{
  it('offers substantive editable templates without database identities',()=>{
    for(const recipe of starterRecipes){const input=recipeSchema.parse(starterToInput(recipe));expect(input.id).toBeUndefined();expect(input.status).toBe('draft');expect(input.steps.length).toBeGreaterThan(3);expect(input.ingredients[0].quantity).toBe(input.dose_g);expect(new URL(recipe.source.url).protocol).toBe('https:');}
  });
  it('filters reference content by the same query and method as discovery',()=>{
    expect(findStarterRecipes('ايروبرس','AeroPress').map(r=>r.slug)).toEqual(['aeropress-upright']);expect(findStarterRecipes('فرنش','V60')).toEqual([]);expect(findStarterRecipes('','Espresso')).toEqual([]);expect(getStarterRecipe('missing')).toBeUndefined();
  });
  it('does not invent water weights for tool-marked recipes or share mutable templates',()=>{
    const recipe=getStarterRecipe('aeropress-upright')!;expect(starterToInput(recipe).water_g).toBeNull();const copy=starterToInput(recipe);copy.steps[0].instruction='changed';expect(starterToInput(recipe).steps[0].instruction).not.toBe('changed');
  });
});
