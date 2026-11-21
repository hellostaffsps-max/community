import type {RecipeInput} from './validation';

export type StarterRecipe={
  slug:string; title:string; description:string; method:string; grind:string;
  dose:number; water:number|null; temperature:number; seconds:number;
  waterLabel?:string; equipment:string[]; steps:string[]; note:string;
  source:{name:string;url:string}; tone:'blue'|'yellow'|'dark';
};

// Editorial starting points, deliberately separate from member-authored database recipes.
export const starterRecipes:StarterRecipe[]=[
  {
    slug:'v60-first-cup',title:'فنجان V60، خطوة بخطوة',method:'V60',tone:'blue',
    description:'خمس صبّات صغيرة لفنجان واحد. نقطة بداية للبن الفاتح، مع مساحة لتعديل الطحنة حسب النتيجة.',
    dose:15,water:250,temperature:100,seconds:180,grind:'متوسط ناعم',
    equipment:['V60 وفلتر ورقي','ميزان','غلاية','كوب أو إبريق تقديم'],
    steps:[
      'اشطف الفلتر بالماء الساخن وتخلّص من ماء الشطف. أضف 15 غرامًا من البن بطحنة متوسطة ناعمة، وصفّر الميزان.',
      'ابدأ المؤقت وصبّ 50 غرامًا من الماء. حرّك القمع بحركة دائرية خفيفة بعد 10–15 ثانية، وانتظر حتى الثانية 45.',
      'بين 0:45 و1:00، ارفع مجموع الماء إلى 100 غرام. انتظر 10 ثوانٍ.',
      'صبّ إلى 150 غرامًا بين 1:10 و1:20، ثم إلى 200 غرام بين 1:30 و1:40.',
      'بين 1:50 و2:00، أكمل إلى 250 غرامًا. حرّك القمع برفق واتركه يصفّي؛ نحو 3 دقائق نقطة مرجعية وليست شرطًا ثابتًا.'
    ],
    note:'الماء المغلي هنا للبن الفاتح. جرّب الوصفة أولًا، ثم غيّر عاملًا واحدًا وسجّل أثره على الطعم.',
    source:{name:'Hario USA · طريقة James Hoffmann لفنجان واحد',url:'https://www.hario-usa.com/blogs/recipes-and-more-from-friends/james-hoffmann-1-cup-v60-technique'}
  },
  {
    slug:'french-press-basics',title:'فرنش برس، بداية بسيطة',method:'French Press',tone:'yellow',
    description:'بن وماء وأربع دقائق نقع. تجربة مباشرة لمن يحب تحضير القهوة بالغمر.',
    dose:30,water:350,temperature:96,seconds:240,grind:'خشن',
    equipment:['فرنش برس','ميزان','غلاية','ملعقة','كوب تقديم'],
    steps:[
      'اطحن 30 غرامًا من البن طحنًا خشنًا ومتجانسًا. جهّز 350 غرامًا من الماء الساخن، نحو 96–99 درجة مئوية.',
      'أضف البن إلى الإبريق، وصفّر الميزان. ابدأ المؤقت وصبّ الماء حتى يتشبّع البن كله.',
      'حرّك برفق لإزالة الجيوب الجافة، وضع الغطاء مع إبقاء المكبس مرفوعًا.',
      'عند الدقيقة الرابعة، اضغط المكبس ببطء خلال نحو 20 ثانية. لا تجبره إذا وجدت مقاومة شديدة.',
      'قدّم القهوة مباشرة، وانقل الباقي إلى إبريق آخر حتى لا يستمر ملامسًا للبن.'
    ],
    note:'هذه نسبة مركّزة نسبيًا. دوّن النتيجة وعدّل كمية البن في تجربتك التالية لتناسب ذوقك.',
    source:{name:'Blue Bottle · دليل الفرنش برس',url:'https://bluebottlecoffee.com/us/eng/brew-guides/french-press'}
  },
  {
    slug:'aeropress-upright',title:'إيروبرس، بالطريقة المعتادة',method:'AeroPress',tone:'dark',
    description:'طريقة الشركة بوضع الأداة المعتدل فوق الكوب، دون قلبها. قياس الماء بعلامة الأداة.',
    dose:17,water:null,waterLabel:'حتى علامة 4',temperature:85,seconds:120,grind:'متوسط ناعم',
    equipment:['AeroPress بالحجم المعتاد','فلتر ورقي','كوب متين','غلاية','ملعقة التحريك'],
    steps:[
      'جهّز ماءً بدرجة 85 مئوية. ضع الفلتر داخل الغطاء وثبّته، ثم ضع الأداة فوق كوب متين.',
      'أضف 17 غرامًا من البن؛ هذا منتصف مجال الشركة 16–18 غرامًا. سوِّ السطح برفق.',
      'صبّ الماء حتى علامة 4 على الحجرة، وحرّك برفق نحو 3 ثوانٍ.',
      'أدخل المكبس قليلًا واسحبه للأعلى مسافة بسيطة لإيقاف التقطير. انتظر 60 ثانية.',
      'اضغط ببطء وثبات دون قوة زائدة حتى يمر الماء. اترك الغطاء يبرد أو استخدم قطعة قماش قبل فكّه.'
    ],
    note:'كمية الماء هنا بعلامة الأداة، لذلك لا نعرض وزنًا أو نسبة مختلقة. هذه التعليمات ليست لموديل XL.',
    source:{name:'AeroPress · تعليمات الاستخدام الرسمية',url:'https://aeropress.com/pages/how-to-use'}
  }
];

export function getStarterRecipe(slug:string){return starterRecipes.find(recipe=>recipe.slug===slug);}
const searchable=(value:string)=>value.toLocaleLowerCase().normalize('NFKC').replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا');
export function findStarterRecipes(q='',method=''){
  const words=searchable(q).trim().split(/\s+/).filter(Boolean);
  return starterRecipes.filter(recipe=>(!method||recipe.method===method)&&words.every(word=>searchable([recipe.title,recipe.description,recipe.method,recipe.grind,...recipe.equipment,'قهوة ماء'].join(' ')).includes(word)));
}
export function starterToInput(recipe:StarterRecipe):RecipeInput{
  return {title:recipe.title,description:`تجربتي انطلاقًا من وصفات البداية: ${recipe.title}.`,category_id:'coffee',method:recipe.method,beans:'',roaster:'',grind:recipe.grind,tasting_notes:'',dose_g:recipe.dose,water_g:recipe.water,yield_g:null,temperature_c:recipe.temperature,time_seconds:recipe.seconds,status:'draft',ingredients:[{name:'قهوة',quantity:recipe.dose,unit:'g'},{name:'ماء',quantity:recipe.water,unit:recipe.water==null?'':'g'}],steps:recipe.steps.map(instruction=>({instruction}))};
}
