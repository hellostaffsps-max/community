import Link from 'next/link';
import {ArrowUpLeft,ArrowDownLeft,BookOpen,Bookmark,FlaskConical,Plus} from 'lucide-react';
import {publicSignupEnabled} from '@/lib/env';

const methods=[
  {name:'V60',label:'كل صبّة تصنع فرقًا.',note:'الترشيح اليدوي'},
  {name:'Espresso',label:'التفاصيل في جرعة.',note:'قهوة مركّزة'},
  {name:'Cold Brew',label:'خذ وقتك. غيّر النكهة.',note:'الاستخلاص البارد'},
];

export function Landing(){
  const signupEnabled=publicSignupEnabled();
  return <>
    <section className="landing-hero landing-width" aria-labelledby="landing-title">
      <div className="landing-copy">
        <span className="overline"><span className="status-dot"/> مجتمع Goat Journey · فلسطين</span>
        <h1 id="landing-title">قهوتك.<br/>خبرتك.<br/><span>ومجتمع يشبهك.</span></h1>
        <p>وراء كل فنجان، تجربة تستحق المشاركة.<br/>هنا ندوّن وصفاتنا، نتبادل التفاصيل، ونتعلّم من بعض. من أول محاولة، لقهوتك التي تفتخر بها.</p>
        <div className="hero-actions"><Link className="button" href="/explore">استكشف الوصفات<ArrowUpLeft size={22}/></Link><a className="quiet-link" href="#about">تعرّف على المجتمع<ArrowDownLeft size={18}/></a></div>
        <div className="hero-footnote"><span className="mini-rule"/> لأهل البار، ولمن يبدأ الرحلة من البيت.</div>
      </div>
      <figure className="landing-visual">
        <img className="hero-photo" src="/images/iced-coffee.webp" alt="قهوة باردة في كوب زجاجي، تتداخل فيها طبقات الحليب والإسبريسو" width={1120} height={1400} fetchPriority="high"/>
        <div className="brand-seal" aria-hidden="true"><img src="/brand/mark.svg" alt="" width={52} height={52}/><span dir="ltr">BREW. SHARE. REPEAT.</span></div>
        <figcaption><span>تجربة اليوم. إلهام الغد.</span><span dir="ltr">THE COMMUNITY EDIT</span></figcaption>
      </figure>
    </section>
    <div className="brand-ribbon"><div className="landing-width"><span>حَضّر. جرّب. شارك.</span><ArrowUpLeft aria-hidden="true"/><span dir="ltr">BETTER COFFEE, TOGETHER.</span></div></div>
    <section className="landing-section landing-width" id="about" aria-labelledby="about-title">
      <div className="editorial-heading"><div><span className="overline">01 / مساحة للتجربة</span><h2 id="about-title">الوصفة أكثر<br/>من مقادير.</h2></div><p>هي اختيار البن، وتعديل الطحنة، والملاحظة التي غيّرت كل شيء. صنعنا هذه المساحة لتبقى التجربة كاملة، وتصل من باريستا لآخر.</p></div>
      <div className="value-grid">
        <article><BookOpen size={29} strokeWidth={1.5}/><span className="feature-number" dir="ltr">01</span><h3>وصفات بكل تفاصيلها</h3><p>مقادير، أدوات، وخطوات واضحة. افهم ما وراء الفنجان، ثم حضّره بطريقتك.</p></article>
        <article><FlaskConical size={29} strokeWidth={1.5}/><span className="feature-number" dir="ltr">02</span><h3>خبرة قابلة للمشاركة</h3><p>دوّن ملاحظات التذوّق، واحكِ ما تعلّمته. تعديل صغير منك قد يصنع فرقًا عند غيرك.</p></article>
        <article><Bookmark size={29} strokeWidth={1.5}/><span className="feature-number" dir="ltr">03</span><h3>دفتر ترجع إليه</h3><p>للأعضاء مساحة لوصفاتهم ومسوداتهم، ومجموعة خاصة من الوصفات المحفوظة.</p></article>
      </div>
    </section>
    <section className="brew-section"><div className="landing-section landing-width">
      <div className="editorial-heading"><div><span className="overline">02 / اتبع فضولك</span><h2>لكل طريقة،<br/>باب جديد للتجربة.</h2></div><Link className="quiet-link" href="/explore">كل طرق التحضير<ArrowUpLeft size={20}/></Link></div>
      <div className="brew-grid">{methods.map((method,index)=><Link className="brew-card" href={`/explore?method=${encodeURIComponent(method.name)}`} key={method.name}><div className="brew-card-top"><span>{method.note}</span><span dir="ltr">0{index+1}</span></div><h3 dir="ltr">{method.name}</h3><div className="brew-card-bottom"><span>{method.label}</span><ArrowUpLeft size={25}/></div></Link>)}</div>
      <p className="section-caption">استكشف طرق التحضير، واطّلع على الوصفات المنشورة حين يشاركها المجتمع.</p>
    </div></section>
    <section className="community-story"><div className="landing-width story-inner"><img src="/brand/mark-yellow.svg" alt="" width={225} height={225} loading="lazy"/><div><span className="overline">من فلسطين، لكل من يحب القهوة</span><h2>المعرفة أحلى<br/>لما نتقاسمها.</h2><p>سواء كنت خلف البار كل يوم، أو تحضّر أول فنجان في البيت، فضولك هو البداية. هنا، كل تجربة لها مكان.</p><Link className="button" href={signupEnabled?'/auth/signup':'/explore'}>{signupEnabled?'ابدأ حسابك المجاني':'خذ جولة في المجتمع'}<ArrowUpLeft size={22}/></Link><small>{signupEnabled?'حساب مجاني، وتجارب نتقاسمها. بلا اشتراك أو رسوم.':'التصفّح مفتوح للجميع. إنشاء الحسابات مغلق حاليًا.'}</small></div></div></section>
    <section className="landing-section landing-width questions-section" id="questions" aria-labelledby="questions-title"><div><span className="overline">قبل أول فنجان</span><h2 id="questions-title">أسئلة على السريع.</h2></div><div className="question-list">
      <details><summary>لمن هذا المجتمع؟<Plus size={20}/></summary><p>لكل من يحب تجربة القهوة وفهمها: الباريستا، العاملين في المقاهي، وهواة التحضير في البيت. لا تحتاج إلى مستوى محدد لتبدأ التصفّح.</p></details>
      <details><summary>هل أحتاج حسابًا لتصفّح الوصفات؟<Plus size={20}/></summary><p>لا. الوصفات المنشورة متاحة للتصفّح للجميع. تحتاج إلى حساب للمشاركة والتعليق وحفظ وصفاتك المفضلة.</p></details>
      <details><summary>هل التسجيل مجاني؟<Plus size={20}/></summary><p>نعم. إنشاء الحساب ومشاركة الوصفات والتعليق وحفظ المفضّلة مجانًا، دون اشتراك أو بطاقة دفع.</p></details>
      <details><summary>كيف أنشئ حسابًا؟<Plus size={20}/></summary><p>{signupEnabled?<>أدخل بريدك وكلمة مرور، ثم أكّد بريدك برمز من 6 أرقام يصلك خلال دقائق. بعدها تصبح مساحتك جاهزة. <Link href="/auth/signup">أنشئ حسابك مجانًا</Link></>:'نجهّز استقبال الأعضاء. التسجيل مغلق حاليًا؛ يمكنك التصفّح أو الدخول بحسابك الموجود.'}</p></details>
    </div></section>
  </>;
}
