import Link from 'next/link';
export default function NotFound(){return <main className="container empty"><span className="eyebrow">404</span><h1>هذه الصفحة غير متاحة.</h1><p>قد تكون خاصة أو حُذفت، أو أن الرابط غير صحيح.</p><Link className="button" href="/">العودة للمجتمع</Link></main>;}
