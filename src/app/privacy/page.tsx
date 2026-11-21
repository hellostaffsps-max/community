import type {Metadata} from 'next';
import Link from 'next/link';
import {ArrowUpLeft,Mail,ShieldCheck} from 'lucide-react';
import {Shell} from '@/components/shell';
import styles from './privacy.module.css';

export const metadata:Metadata={
  title:'سياسة الخصوصية',
  description:'كيف يستخدم Goat Journey Community بيانات الحساب والمحتوى وخدمات تسجيل الدخول والبريد والاستضافة.',
  alternates:{canonical:'https://goatlab.my/privacy'},
};

export default function PrivacyPage(){
  return <Shell active="privacy"><article className={styles.page}>
    <header className={styles.header}>
      <span className={styles.eyebrow}><ShieldCheck size={18}/>Goat Journey Community</span>
      <h1>سياسة الخصوصية</h1>
      <p>هذه الصفحة توضح كيف تُستخدم بياناتك عند تصفّح مجتمع جوت جيرني وإنشاء حساب ومشاركة تجاربك على <bdi>goatlab.my</bdi>.</p>
      <small>آخر تحديث: <time dateTime="2026-11-21">21 نوفمبر 2026</time></small>
    </header>

    <nav className={styles.contents} aria-label="محتويات سياسة الخصوصية">
      <a href="#account-data">الحساب وتسجيل الدخول</a>
      <a href="#public-content">المحتوى والخصوصية</a>
      <a href="#service-providers">الخدمات المستخدمة</a>
      <a href="#privacy-contact">التواصل بشأن بياناتك</a>
    </nav>

    <section className={styles.section} id="account-data" aria-labelledby="account-data-title">
      <h2 id="account-data-title">الحساب وتسجيل الدخول</h2>
      <p>تستخدم المنصة Supabase لإدارة الحسابات. تشمل بيانات الحساب معرّف المستخدم، البريد الإلكتروني، حالة تأكيده، ومعلومات جلسة تسجيل الدخول. عند التسجيل بالبريد، تُرسل بيانات المصادقة إلى هذه الخدمة لإنشاء الحساب والتحقق من الدخول واستعادة الوصول إليه.</p>
      <p>يمكنك استخدام البريد وكلمة المرور. وعند اختيار تسجيل الدخول باستخدام Google، إذا كان متاحًا، تُشارك Google مع خدمة المصادقة معرّف حسابك وبريدك وحالة تأكيده، وقد تُشارك اسمك ورابط صورتك بحسب البيانات المتاحة. تُستخدم هذه المعلومات للتعرّف على حسابك وتسجيل دخولك. هذا المسار يبدأ باختيارك؛ تسجيل الدخول باستخدام Apple غير مفعّل حاليًا.</p>
      <p>بيانات تسجيل الدخول منفصلة عن ملف المجتمع العام. لا يُنسخ اسم Google أو صورته تلقائيًا إلى ملفك العام في الإعداد الحالي، ولا يُضاف بريد تسجيل الدخول إلى الحقول العامة للملف.</p>
    </section>

    <section className={styles.section} id="public-content" aria-labelledby="public-content-title">
      <h2 id="public-content-title">ما يظهر للآخرين وما يبقى خاصًا</h2>
      <ul className={styles.list}>
        <li><strong>الملف العام:</strong> اسم العرض واسم المستخدم والنبذة والمدينة وجهة العمل والبلد والصورة التي تضيفها إلى ملفك متاحة لزوار المجتمع.</li>
        <li><strong>المحتوى المنشور:</strong> الوصفات التي تنشرها، بما فيها المكونات والخطوات والصور، وتعليقاتك على الوصفات العامة تظهر مع هوية ملفك. المحتوى الذي يُخفيه الإشراف لا يظهر للعامة.</li>
        <li><strong>المسودات والمحفوظات والمتابعات:</strong> مسودات وصفاتك وقائمة الوصفات المحفوظة والأشخاص الذين تتابعهم لا تُعرض للعامة. تُستخدم المتابعات لترتيب موجز «أتابعهم»، ولا تعني اشتراكًا في بريد الأشخاص الذين تتابعهم.</li>
        <li><strong>البلاغات والإشراف:</strong> تُحفظ البلاغات وقرارات مراجعتها لتشغيل الإشراف. يستطيع صاحب البلاغ والمشرفون الاطلاع على البلاغ وفق صلاحياتهم، ويمكن للمشرفين مراجعة المحتوى المرتبط به.</li>
      </ul>
    </section>

    <section className={styles.section} id="service-providers" aria-labelledby="service-providers-title">
      <h2 id="service-providers-title">الخدمات المستخدمة لتشغيل المجتمع</h2>
      <p>تمر البيانات اللازمة لتقديم هذه الوظائف عبر الخدمات التالية:</p>
      <dl className={styles.services}>
        <div><dt>Supabase</dt><dd>المصادقة وجلسات الدخول وقاعدة بيانات المجتمع وتخزين الصور، مع قواعد وصول تفصل البيانات العامة عن بيانات الحساب الخاصة. <a href="https://supabase.com/privacy">خصوصية Supabase</a>.</dd></div>
        <div><dt>Resend</dt><dd>إرسال رسائل الحساب، مثل تأكيد البريد واستعادة كلمة المرور، عبر إعداد البريد في Supabase. تشمل عملية الإرسال عنوان المستلم ومحتوى الرسالة وبيانات تسليمها. <a href="https://resend.com/legal/privacy-policy">خصوصية Resend</a>.</dd></div>
        <div><dt>Cloudflare</dt><dd>استضافة الموقع وتوصيل الطلبات، واستخدام Turnstile لحماية نماذج الحساب من إساءة الاستخدام. قد تُعالَج معلومات تقنية مثل عنوان الاتصال وبيانات المتصفح وإشارات التحقق لهذا الغرض. <a href="https://www.cloudflare.com/privacypolicy/">خصوصية Cloudflare</a> و<a href="https://www.cloudflare.com/turnstile-privacy-policy/">ملحق خصوصية Turnstile</a>.</dd></div>
        <div><dt>Google — عند اختيارك</dt><dd>التحقق من هويتك عند استخدام خيار Google لتسجيل الدخول. تتعامل Google مع هذه العملية وفق <a href="https://policies.google.com/privacy">سياسة خصوصيتها</a>.</dd></div>
      </dl>
    </section>

    <section className={styles.section} aria-labelledby="browser-data-title">
      <h2 id="browser-data-title">ملفات الارتباط والنسخ المحلية</h2>
      <p>يستخدم تسجيل الدخول ملفات ارتباط لحفظ الجلسة وإكمال التحقق من الدخول. كما يحتفظ محرر الوصفة بنسخة عمل في التخزين المحلي لمتصفحك لمساعدتك على استعادة تعديلات لم تحفظها بعد. هذه النسخة مرتبطة بالحساب والوصفة على ذلك المتصفح، ولا تُنشر في المجتمع تلقائيًا.</p>
      <p>يمكنك إزالة بيانات الموقع من إعدادات متصفحك. يزيل ذلك بيانات الجلسة والنسخ المحلية في المتصفح، لكنه لا يحذف المحتوى المحفوظ في حسابك على المنصة.</p>
    </section>

    <section className={styles.section} aria-labelledby="account-choices-title">
      <h2 id="account-choices-title">اختياراتك داخل المجتمع</h2>
      <p>يمكنك تعديل بيانات ملفك من إعدادات الحساب، واختيار حفظ الوصفة كمسودة أو نشرها، وإزالة وصفة من محفوظاتك أو إلغاء متابعة شخص. التسجيل واستخدام ميزات المجتمع الحالية مجانًا، ولا تتطلب هذه الخطوات بطاقة دفع أو اشتراكًا مدفوعًا.</p>
      <Link className={styles.accountLink} href="/account?tab=profile">إعدادات الملف الشخصي<ArrowUpLeft size={17}/></Link>
    </section>

    <section className={styles.contact} id="privacy-contact" aria-labelledby="privacy-contact-title">
      <Mail size={24}/>
      <div><h2 id="privacy-contact-title">للتواصل بشأن بياناتك</h2><p>للاستفسار عن هذه الصفحة أو لطلب الوصول إلى بياناتك أو تصحيحها أو حذف حسابك وبياناته، تواصل مع إدارة Goat Journey Community عبر:</p><a href="mailto:wallykht1@gmail.com"><bdi>wallykht1@gmail.com</bdi></a></div>
    </section>
  </article></Shell>;
}
