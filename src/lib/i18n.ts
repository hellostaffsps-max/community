export const ar={
  brand:'Goat Journey',community:'مجتمع الباريستا',explore:'استكشف الوصفات',add:'أضف وصفتك',account:'مساحتي',login:'تسجيل الدخول',signup:'انضم للمجتمع',
  heroTitle:'كل فنجان، بداية حكاية.',heroText:'مساحة للباريستا في فلسطين. شارك وصفتك، تعلّم من تجربة غيرك، وخذ قهوتك للخطوة التالية.',
  empty:'الحكاية تبدأ بوصفة.',emptyText:'لا توجد وصفات هنا بعد. شارك أول تجربة، أو جرّب بحثًا آخر.',
};
export const locale={code:'ar',direction:'rtl',numberLocale:'en-US'} as const;
export function number(value:number){return new Intl.NumberFormat(locale.numberLocale,{maximumFractionDigits:2}).format(value);}
export function date(value:string){return new Intl.DateTimeFormat('ar-PS-u-nu-latn',{day:'numeric',month:'short',year:'numeric'}).format(new Date(value));}
