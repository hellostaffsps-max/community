import type { RecipeInput } from './validation';
export type Profile={id:string;username:string;display_name:string;bio:string;city:string;workplace:string;country_code:string;avatar_path:string|null};
export type Recipe=Omit<RecipeInput,'id'|'version'>&{id:string;version:number;owner_id:string;hidden_at:string|null;created_at:string;updated_at:string;profiles:Profile;recipe_images:{object_path:string;alt_text:string}|null};
export type Comment={id:string;recipe_id:string;author_id:string;body:string;hidden_at:string|null;created_at:string;profiles:Profile};
export type Report={id:string;recipe_id:string|null;comment_id:string|null;reason:string;status:string;created_at:string;recipes:{title:string}|null;comments:{body:string;recipe_id:string}|null};
export type Viewer={id:string;email?:string;moderator:boolean};
export type PageData={recipes?:Recipe[];recipe?:Recipe;comments?:Comment[];saved?:boolean;profile?:Profile;members?:Profile[];savedIds?:string[];reports?:Report[];categories?:{id:string;name_ar:string}[];hasMore?:boolean;total?:number};
