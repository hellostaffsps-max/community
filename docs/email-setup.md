# بريد community والتسجيل المجاني — 2026-11-20

## طريقة التسجيل

تتبع الواجهة طريقة Goat Journey Lab: بريد وكلمة مرور، ثم رمز تأكيد من 6 أرقام، ثم الحساب. الحساب مجاني دون اشتراك أو بطاقة أو رسوم. لا توجد ميزة Google. تقبل خانة الرمز الأرقام العربية والفارسية والإنجليزية وتحفظ الأصفار الأولى. مدة الرمز 10 دقائق، وإعادة الإرسال متاحة بعد 60 ثانية. إنشاء كلمة المرور واستعادتها يتطلبان 12 حرفًا على الأقل.

## إعداد البريد المحفوظ

وافق المالك على استخدام حساب Resend الموجود ضمن Free فقط. تم توثيق `auth.goatlab.my` في Resend بمنطقة Tokyo؛ أظهرت اللوحة Verified / Ready. لا يوجد صندوق استقبال أو اشتراك مدفوع في Hostinger.

| Supabase Custom SMTP | القيمة المحفوظة |
| --- | --- |
| المشروع | `feyugmltesjdwejbzgzs` |
| Sender email | `noreply@auth.goatlab.my` |
| Sender name | `Goat Journey Community` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | محفوظ مباشرة في Supabase، وليس في المستودع أو متغيرات الموقع |

المفتاح باسم `community Supabase SMTP`، بصلاحية Sending access لنطاق `auth.goatlab.my` فقط. حُفظ SMTP وظهرت إشارة Stored password is hidden. هذا يؤكد حفظ الإعداد، ولا يثبت وصول رسالة إلى صندوق المستخدم.

سجلات Cloudflare المعتمدة والمحفوظة:

- TXT باسم `resend._domainkey.auth` بقيمة DKIM المقدمة من Resend.
- CNAME باسم `rsend.auth` إلى `rsend-apne1.forge.rmta.net`، DNS Only.
- CNAME باسم `send.auth` إلى `send.forge.rmta.net`، DNS Only.

لم تتغير وجهة الموقع أو سجلات الجذر وwww خلال إعداد البريد. بقي الاستقبال معطلًا. أظهرت خطة Resend المجانية 3,000 رسالة شهريًا و100 يوميًا، دون pay-as-you-go. حصة Supabase الافتراضية بعد تفعيل SMTP هي 30 رسالة في الساعة؛ لم تُرفع الحصص أو تُشترَ ترقية.

## التأكيد والحماية

حُفظ قالب Confirm sign up من `supabase/templates/confirmation-code.html` بعنوان «رمز تأكيد حسابك — Goat Journey Community». يستخدم `{{ .Token }}` ولا يرسل رمز الحساب في URL. عُوين القالب العربي بعد الحفظ. حُفظت إعدادات Email OTP: طول 6 وصلاحية 600 ثانية، والحد الأدنى لكلمة المرور 12. تأكيد البريد مفعّل، وGoogle والدخول المجهول معطّلان.

أُنشئ Turnstile باسم `community` لنطاق `goatlab.my` فقط، بوضع Managed وبدون pre-clearance. مفتاحه العام محفوظ في `NEXT_PUBLIC_TURNSTILE_SITE_KEY` في بناء Cloudflare، وتأكد وجود المفتاح الصحيح في ملفات الموقع المنشورة. حُفظ السر وتفعيل CAPTCHA في Supabase Auth؛ لا يدخل السر ملفات التطبيق. أثبت اختبار طلب دخول بلا CAPTCHA أن Supabase يرفضه بـHTTP 400 و`captcha_failed`، دون إنشاء مستخدم أو إرسال بريد.

## حالة الإطلاق والتحقق المتبقي

حُفظ `ALLOW_PUBLIC_SIGNUP=true` في بناء Cloudflare، وتأكد مباشرة من إعدادات Supabase أن `disable_signup=false` و`mailer_autoconfirm=false` و`external.google=false`. تُطبّق قيمة Cloudflare عند بناء ونشر نسخة جديدة؛ لا تتغير بمجرد حفظ قيمة البناء. الكود يرفض التسجيل ما لم يُضبط علم الفتح والمفتاح العام معًا. الإعداد المحلي يبقى مغلقًا افتراضيًا.

المتبقي لاختبار البريد من البداية للنهاية: إكمال تسجيل حقيقي بواسطة المالك والتحقق من وصول الرمز والجلسة واستعادة كلمة المرور. يدخل المالك كلمة المرور والرمز مباشرة في الموقع، دون إرسالها في المحادثة. لا تعتبر نجاح البناء أو حفظ SMTP دليلًا على وصول البريد، ولا تنشئ حسابًا وهميًا في الإنتاج.

المراجع: [Resend SMTP](https://resend.com/docs/send-with-supabase-smtp)، [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp)، [قوالب البريد](https://supabase.com/docs/guides/auth/auth-email-templates).
