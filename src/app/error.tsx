'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="container empty"><h1>تعذّر فتح الصفحة.</h1><p>حاول مجددًا. إذا استمرت المشكلة، عد بعد قليل.</p><button className="button" onClick={reset}>إعادة المحاولة</button></main>;}
